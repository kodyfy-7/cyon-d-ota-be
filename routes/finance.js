const express = require("express");

const FinanceController = require("../app/controllers/FinanceController");
const {
    validate,
    validateLogOfflinePayment,
    validateInitializeOnlinePayment,
    validateRejectOfflinePayment
} = require("../app/services/Validation/RequestValidation");
const { authenticateAdmin } = require("../middleware/authenticateAdmin");

const router = express.Router();

router.route("/finance/payment-types").get(FinanceController.getPaymentTypes);

router
    .route("/finance/payments/offline")
    .post(authenticateAdmin, validateLogOfflinePayment(), validate, FinanceController.logOfflinePayment);

router
    .route("/finance/payments/online/initialize")
    .post(authenticateAdmin, validateInitializeOnlinePayment(), validate, FinanceController.initializeOnlinePayment);

router
    .route("/finance/payments/online/verify/:reference")
    .get(authenticateAdmin, FinanceController.verifyOnlinePayment);

router
    .route("/finance/payments/online/webhook")
    .post(FinanceController.handlePaystackWebhook);

router
    .route("/finance/payments/:paymentId/approve")
    .patch(authenticateAdmin, FinanceController.approveOfflinePayment);

router
    .route("/finance/payments/:paymentId/reject")
    .patch(authenticateAdmin, validateRejectOfflinePayment(), validate, FinanceController.rejectOfflinePayment);

router
    .route("/finance/payments/summary")
    .get(authenticateAdmin, FinanceController.getPaymentSummary);

router
    .route("/finance/payments/:paymentId")
    .get(authenticateAdmin, FinanceController.getPaymentById);

router
    .route("/finance/payments")
    .get(authenticateAdmin, FinanceController.getPayments);

module.exports = router;
