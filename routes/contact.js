const express = require("express");
const ContactController = require("../app/controllers/ContactController");
const {
    validate,
    validateContactUs
} = require("../app/services/Validation/RequestValidation");

const router = express.Router();

router
    .route("/contact-us")
    .post(validateContactUs(), validate, ContactController.submitContactUs);

module.exports = router;
