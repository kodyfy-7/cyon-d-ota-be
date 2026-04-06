const express = require("express");
const AuthController = require("../app/controllers/AuthController");
const {
    validate,
    validateRegister,
    validateLogin,
    validateRefreshToken
} = require("../app/services/Validation/RequestValidation");

const router = express.Router();

router.route("/auth/register").post(validateRegister(), validate, AuthController.register);

router.route("/auth/login").post(validateLogin(), validate, AuthController.login);

router.route("/auth/refresh").post(validateRefreshToken(), validate, AuthController.refreshToken);

module.exports = router;
