"use strict";

const PAYMENT_TYPES = [
    "monthly_dues",
    "launching",
    "welfare_levy",
    "event_fee",
    "donation",
    "special_assessment"
];

const PAYMENT_CHANNELS = ["offline"];
// const PAYMENT_CHANNELS = ["offline", "paystack"];

const PAYMENT_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "initiated",
    "paid",
    "failed",
    "refunded"
];

module.exports = {
    PAYMENT_TYPES,
    PAYMENT_CHANNELS,
    PAYMENT_STATUSES
};
