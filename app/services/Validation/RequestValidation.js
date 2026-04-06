/* eslint-disable consistent-return */
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    param: err.param,
    message: err.msg
  }));

  return res.status(422).json({
    errors: extractedErrors,
    message: "Validation failed. Please check the provided data."
  });
};

const okvalidate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(422).json({ errors: errors.array() });
  };
};

const validateCreateEvent = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string"),

    body("fileUrl")
      .optional({ nullable: true })
      .isString()
      .withMessage("File URL must be a string"),

    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage("Description must be a string"),

    body("slug")
      .optional({ nullable: true })
      .isString()
      .withMessage("Slug must be a string")
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage("Slug must be lowercase and URL-friendly")
  ];
};

const validateUpdateEvent = () => {
  return [
    body("name")
      .optional({ nullable: true })
      .isString()
      .withMessage("Name must be a string"),

    body("fileUrl")
      .optional({ nullable: true })
      .isString()
      .withMessage("File URL must be a string"),

    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage("Description must be a string"),

    body("slug")
      .optional({ nullable: true })
      .isString()
      .withMessage("Slug must be a string")
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage("Slug must be lowercase and URL-friendly")
  ];
};

const validateRegister = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be a valid email address")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("phoneNumber")
      .optional({ nullable: true })
      .isString()
      .withMessage("Phone number must be a string"),

    body("parishId")
      .notEmpty()
      .withMessage("Parish ID is required")
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("positionId")
      .notEmpty()
      .withMessage("Position ID is required")
      .isUUID()
      .withMessage("Position ID must be a valid UUID"),

    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isString()
      .withMessage("Gender must be a string"),

    body("dateOfBirth")
      .notEmpty()
      .withMessage("Date of birth is required")
      .isDate()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
  ];
};

const validateLogin = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be a valid email address")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
  ];
};

const validateRefreshToken = () => {
  return [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token is required")
      .isString()
      .withMessage("Refresh token must be a string")
  ];
};

const validateCreateMember = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be a valid email address")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("phoneNumber")
      .optional({ nullable: true })
      .isString()
      .withMessage("Phone number must be a string"),

    body("parishId")
      .notEmpty()
      .withMessage("Parish ID is required")
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("positionId")
      .notEmpty()
      .withMessage("Position ID is required")
      .isUUID()
      .withMessage("Position ID must be a valid UUID"),

    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isString()
      .withMessage("Gender must be a string"),

    body("dateOfBirth")
      .notEmpty()
      .withMessage("Date of birth is required")
      .isDate()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
  ];
};

const validateUpdateMember = () => {
  return [
    body("name")
      .optional({ nullable: true })
      .isString()
      .withMessage("Name must be a string"),

    body("phoneNumber")
      .optional({ nullable: true })
      .isString()
      .withMessage("Phone number must be a string"),

    body("parishId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("positionId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Position ID must be a valid UUID"),

    body("gender")
      .optional({ nullable: true })
      .isString()
      .withMessage("Gender must be a string"),

    body("dateOfBirth")
      .optional({ nullable: true })
      .isDate()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),

    body("isActive")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isActive must be a boolean"),

    body("isSuper")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isSuper must be a boolean")
  ];
};

const validateMakeAdmin = () => {
  return [
    body("positionId")
      .notEmpty()
      .withMessage("Position ID is required")
      .isUUID()
      .withMessage("Position ID must be a valid UUID"),

    body("isSuper")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isSuper must be a boolean")
  ];
};

const validateCreatePosition = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Position name is required")
      .isString()
      .withMessage("Position name must be a string"),

    body("isExco")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isExco must be a boolean")
  ];
};

const validateUpdatePosition = () => {
  return [
    body("name")
      .optional({ nullable: true })
      .isString()
      .withMessage("Position name must be a string"),

    body("isExco")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isExco must be a boolean")
  ];
};

const validateCreateParish = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Parish name is required")
      .isString()
      .withMessage("Parish name must be a string"),

    body("isDeanery")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isDeanery must be a boolean")
  ];
};

const validateUpdateParish = () => {
  return [
    body("name")
      .optional({ nullable: true })
      .isString()
      .withMessage("Parish name must be a string"),

    body("isDeanery")
      .optional({ nullable: true })
      .isBoolean()
      .withMessage("isDeanery must be a boolean")
  ];
};

const validateEventRegistration = () => {
  return [
    body("fullName")
      .notEmpty()
      .withMessage("Full name is required")
      .isString()
      .withMessage("Full name must be a string"),

    body("parishId")
      .notEmpty()
      .withMessage("Parish ID is required")
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("ageRange")
      .notEmpty()
      .withMessage("Age range is required")
      .isString()
      .withMessage("Age range must be a string"),

    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isString()
      .withMessage("Gender must be a string")
  ];
};

const validateUpdateApprovalStatus = () => {
  return [
    body("action")
      .notEmpty()
      .withMessage("Action is required")
      .isIn(["approve", "reject"])
      .withMessage("Action must be either approve or reject")
  ];
};

const validateContactUs = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be a valid email address")
      .normalizeEmail(),

    body("phoneNumber")
      .optional({ nullable: true })
      .isString()
      .withMessage("Phone number must be a string"),

    body("subject")
      .notEmpty()
      .withMessage("Subject is required")
      .isString()
      .withMessage("Subject must be a string"),

    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isString()
      .withMessage("Message must be a string")
  ];
};

const validateLogOfflinePayment = () => {
  return [
    body("parishId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("paymentType")
      .notEmpty()
      .withMessage("Payment type is required")
      .isString()
      .withMessage("Payment type must be a string"),

    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0"),

    body("currency")
      .optional({ nullable: true })
      .isString()
      .withMessage("Currency must be a string"),

    body("proofFileUrl")
      .notEmpty()
      .withMessage("Proof file URL is required for offline payment")
      .isString()
      .withMessage("Proof file URL must be a string"),

    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage("Description must be a string")
  ];
};

const validateInitializeOnlinePayment = () => {
  return [
    body("parishId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Parish ID must be a valid UUID"),

    body("paymentType")
      .notEmpty()
      .withMessage("Payment type is required")
      .isString()
      .withMessage("Payment type must be a string"),

    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0"),

    body("currency")
      .optional({ nullable: true })
      .isString()
      .withMessage("Currency must be a string"),

    body("callbackUrl")
      .optional({ nullable: true })
      .isString()
      .withMessage("Callback URL must be a string"),

    body("email")
      .optional({ nullable: true })
      .isEmail()
      .withMessage("Email must be a valid email address"),

    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage("Description must be a string")
  ];
};

const validateRejectOfflinePayment = () => {
  return [
    body("reason")
      .optional({ nullable: true })
      .isString()
      .withMessage("Reason must be a string")
  ];
};

module.exports = {
  validate,
  okvalidate,
  validateCreateEvent,
  validateUpdateEvent,
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateCreateMember,
  validateUpdateMember,
  validateMakeAdmin,
  validateCreatePosition,
  validateUpdatePosition,
  validateContactUs,
  validateCreateParish,
  validateUpdateParish,
  validateEventRegistration,
  validateUpdateApprovalStatus,
  validateLogOfflinePayment,
  validateInitializeOnlinePayment,
  validateRejectOfflinePayment
};
