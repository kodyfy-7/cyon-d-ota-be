const express = require("express");
const ParishController = require("../app/controllers/ParishController");
const {
    validate,
    validateCreateParish,
    validateUpdateParish
} = require("../app/services/Validation/RequestValidation");
const { authenticateAdmin } = require("../middleware/authenticateAdmin");

const router = express.Router();

router.route("/parishes").get(authenticateAdmin, ParishController.getAllParishes);

router
    .route("/parishes")
    .post(authenticateAdmin, validateCreateParish(), validate, ParishController.createParish);

router.route("/parishes/:parishId").get(authenticateAdmin, ParishController.getParishById);

router
    .route("/parishes/:parishId")
    .patch(authenticateAdmin, validateUpdateParish(), validate, ParishController.updateParish);

router.route("/parishes/:parishId").delete(authenticateAdmin, ParishController.deleteParish);

module.exports = router;
