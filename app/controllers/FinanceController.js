"use strict";

const axios = require("axios");
const crypto = require("crypto");
const { Op, fn, col } = require("sequelize");

const errorHandler = require("../../middleware/errorHandler");
const PaginationService = require("../../helpers/pagination");
const Payment = require("../../models/Payment");
const Parish = require("../../models/Parish");
const Member = require("../../models/Member");
const User = require("../../models/User");
const {
    PAYMENT_TYPES,
    PAYMENT_CHANNELS,
    PAYMENT_STATUSES
} = require("../constants/paymentTypes");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const koboAmount = (amount) => Math.round(Number(amount) * 100);

const generatePaymentReference = () => {
    const ts = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OTD-${ts}-${rand}`;
};

const ensureAcceptedPaymentType = (paymentType) => PAYMENT_TYPES.includes(paymentType);
const resolveMemberParishId = (req) => req.member?.parishId || null;

const getPaystackHeaders = () => {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
    };
};

const resolveAndValidateParishForLoggedInUser = async (req, providedParishId) => {
    const loggedInParishId = resolveMemberParishId(req);

    if (!loggedInParishId) {
        return {
            ok: false,
            code: 422,
            payload: {
                success: false,
                message: "Logged-in member does not have a parish assigned."
            }
        };
    }

    if (providedParishId && providedParishId !== loggedInParishId) {
        return {
            ok: false,
            code: 403,
            payload: {
                success: false,
                message: "parishId must match the logged-in member parish."
            }
        };
    }

    const parish = await Parish.findOne({ where: { id: loggedInParishId } });
    if (!parish) {
        return {
            ok: false,
            code: 404,
            payload: {
                success: false,
                message: "Parish not found"
            }
        };
    }

    return {
        ok: true,
        parishId: loggedInParishId,
        parish
    };
};

exports.getPaymentTypes = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            paymentTypes: PAYMENT_TYPES,
            channels: PAYMENT_CHANNELS,
            statuses: PAYMENT_STATUSES
        }
    });
};

exports.logOfflinePayment = async (req, res) => {
    try {
        const {
            parishId,
            paymentType,
            amount,
            currency = "NGN",
            proofFileUrl,
            description
        } = req.body;

        if (!ensureAcceptedPaymentType(paymentType)) {
            return res.status(422).json({
                success: false,
                message: "Unsupported payment type"
            });
        }

        const parishValidation = await resolveAndValidateParishForLoggedInUser(req, parishId);
        if (!parishValidation.ok) {
            return res.status(parishValidation.code).json(parishValidation.payload);
        }

        const payment = await Payment.create({
            reference: generatePaymentReference(),
            memberId: req.member?.id || null,
            parishId: parishValidation.parishId,
            paymentType,
            channel: "offline",
            amount,
            currency,
            status: "pending",
            proofFileUrl,
            description: description || null
        });

        return res.status(201).json({
            success: true,
            message: "Offline payment logged and pending approval.",
            data: payment
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error logging offline payment", req.originalUrl));
    }
};

exports.initializeOnlinePayment = async (req, res) => {
    try {
        const {
            parishId,
            paymentType,
            amount,
            currency = "NGN",
            callbackUrl,
            description,
            email
        } = req.body;

        if (!ensureAcceptedPaymentType(paymentType)) {
            return res.status(422).json({
                success: false,
                message: "Unsupported payment type"
            });
        }

        const parishValidation = await resolveAndValidateParishForLoggedInUser(req, parishId);
        if (!parishValidation.ok) {
            return res.status(parishValidation.code).json(parishValidation.payload);
        }

        const user = await User.findOne({ where: { id: req.user?.id } });
        const payerEmail = email || user?.email;

        if (!payerEmail) {
            return res.status(422).json({
                success: false,
                message: "Payer email is required."
            });
        }

        const reference = generatePaymentReference();

        const payment = await Payment.create({
            reference,
            paystackReference: reference,
            memberId: req.member?.id || null,
            parishId: parishValidation.parishId,
            paymentType,
            channel: "paystack",
            amount,
            currency,
            status: "initiated",
            description: description || null,
            metadata: { payerEmail }
        });

        const payload = {
            email: payerEmail,
            amount: koboAmount(amount),
            reference,
            callback_url: callbackUrl || process.env.PAYSTACK_CALLBACK_URL,
            metadata: {
                paymentId: payment.id,
                paymentType,
                parishId: parishValidation.parishId
            }
        };

        const paystackResponse = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            payload,
            { headers: getPaystackHeaders() }
        );

        return res.status(200).json({
            success: true,
            message: "Payment initialized.",
            data: {
                payment,
                paystack: paystackResponse.data?.data || null
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error initializing online payment", req.originalUrl));
    }
};

exports.verifyOnlinePayment = async (req, res) => {
    try {
        const { reference } = req.params;

        const paystackResponse = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            { headers: getPaystackHeaders() }
        );

        const payload = paystackResponse.data?.data;

        if (!payload) {
            return res.status(404).json({
                success: false,
                message: "Payment verification data not found."
            });
        }

        const payment = await Payment.findOne({
            where: {
                [Op.or]: [{ reference }, { paystackReference: reference }]
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const paid = payload.status === "success";

        payment.status = paid ? "paid" : payment.status;
        payment.metadata = {
            ...(payment.metadata || {}),
            paystackVerify: payload
        };
        await payment.save();

        return res.status(200).json({
            success: true,
            data: {
                payment,
                verification: payload
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error verifying online payment", req.originalUrl));
    }
};

exports.handlePaystackWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-paystack-signature"];

        if (process.env.PAYSTACK_SECRET_KEY && signature) {
            const hash = crypto
                .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
                .update(JSON.stringify(req.body))
                .digest("hex");

            if (hash !== signature) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid webhook signature"
                });
            }
        }

        const event = req.body?.event;
        const data = req.body?.data;

        if (event === "charge.success" && data?.reference) {
            const payment = await Payment.findOne({
                where: {
                    [Op.or]: [
                        { reference: data.reference },
                        { paystackReference: data.reference }
                    ]
                }
            });

            if (payment) {
                payment.status = "paid";
                payment.metadata = {
                    ...(payment.metadata || {}),
                    paystackWebhook: data
                };
                await payment.save();
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error processing paystack webhook", req.originalUrl));
    }
};

exports.approveOfflinePayment = async (req, res) => {
    try {
        if (!req.member?.isSuper) {
            return res.status(403).json({
                success: false,
                message: "Only super admin can approve offline payments."
            });
        }

        const { paymentId } = req.params;

        const payment = await Payment.findOne({ where: { id: paymentId } });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        if (payment.channel !== "offline") {
            return res.status(409).json({
                success: false,
                message: "Only offline payments can be approved manually."
            });
        }

        if (payment.status !== "pending") {
            return res.status(409).json({
                success: false,
                message: "Only pending offline payments can be approved."
            });
        }

        payment.status = "approved";
        payment.approvedBy = req.member.id;
        payment.approvedAt = new Date();
        payment.rejectionReason = null;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Offline payment approved.",
            data: payment
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error approving offline payment", req.originalUrl));
    }
};

exports.rejectOfflinePayment = async (req, res) => {
    try {
        if (!req.member?.isSuper) {
            return res.status(403).json({
                success: false,
                message: "Only super admin can reject offline payments."
            });
        }

        const { paymentId } = req.params;
        const { reason } = req.body;

        const payment = await Payment.findOne({ where: { id: paymentId } });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        if (payment.channel !== "offline") {
            return res.status(409).json({
                success: false,
                message: "Only offline payments can be rejected manually."
            });
        }

        if (payment.status !== "pending") {
            return res.status(409).json({
                success: false,
                message: "Only pending offline payments can be rejected."
            });
        }

        payment.status = "rejected";
        payment.approvedBy = req.member.id;
        payment.approvedAt = new Date();
        payment.rejectionReason = reason || null;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Offline payment rejected.",
            data: payment
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error rejecting offline payment", req.originalUrl));
    }
};

exports.getPayments = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 25,
            sort = "createdAt:desc",
            paymentType,
            channel,
            status,
            parishId,
            memberId,
            startDate,
            endDate,
            search
        } = req.query;

        const where = {};

        if (paymentType) where.paymentType = paymentType;
        if (channel) where.channel = channel;
        if (status) where.status = status;
        if (parishId) where.parishId = parishId;
        if (memberId) where.memberId = memberId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = startDate;
            if (endDate) where.createdAt[Op.lte] = endDate;
        }

        if (search) {
            where[Op.or] = [
                { reference: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const paginate = PaginationService.pagination({ page, perPage });

        const results = await Payment.findAndCountAll({
            where,
            include: [
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                {
                    model: Member,
                    as: "member",
                    attributes: ["id", "userId", "parishId", "positionId", "isSuper"],
                    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber"] }]
                },
                {
                    model: Member,
                    as: "approver",
                    attributes: ["id", "userId", "isSuper"],
                    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
                }
            ],
            order: PaginationService.sortList({ sort }),
            ...paginate,
            subQuery: false
        });

        const meta = PaginationService.paginationLink({
            total: results.count,
            page,
            perPage
        });

        return res.status(200).json({
            success: true,
            data: { payments: results.rows },
            meta
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching payments", req.originalUrl));
    }
};

exports.getPaymentById = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findOne({
            where: { id: paymentId },
            include: [
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                {
                    model: Member,
                    as: "member",
                    attributes: ["id", "userId", "parishId", "positionId", "isSuper"],
                    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber"] }]
                },
                {
                    model: Member,
                    as: "approver",
                    attributes: ["id", "userId", "isSuper"],
                    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
                }
            ]
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        return res.status(200).json({ success: true, data: payment });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching payment", req.originalUrl));
    }
};

exports.getPaymentSummary = async (req, res) => {
    try {
        const { startDate, endDate, parishId } = req.query;

        const where = {
            [Op.or]: [
                { channel: "offline", status: "approved" },
                { channel: "paystack", status: "paid" }
            ]
        };

        if (parishId) where.parishId = parishId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = startDate;
            if (endDate) where.createdAt[Op.lte] = endDate;
        }

        const totals = await Payment.findOne({
            where,
            attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "totalRevenue"]],
            raw: true
        });

        const groupedByType = await Payment.findAll({
            where,
            attributes: [
                "paymentType",
                [fn("COUNT", col("id")), "count"],
                [fn("COALESCE", fn("SUM", col("amount")), 0), "totalAmount"]
            ],
            group: ["paymentType"],
            order: [["paymentType", "ASC"]],
            raw: true
        });

        const pendingOfflineCount = await Payment.count({
            where: { channel: "offline", status: "pending", ...(parishId ? { parishId } : {}) }
        });

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue: totals?.totalRevenue || "0",
                groupedByPaymentType: groupedByType,
                pendingOfflineApprovals: pendingOfflineCount
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching payment summary", req.originalUrl));
    }
};
