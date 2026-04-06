const express = require("express");
const PositionController = require("../app/controllers/PositionController");
const {
    validate,
    validateCreatePosition,
    validateUpdatePosition
} = require("../app/services/Validation/RequestValidation");
const { authenticateAdmin } = require("../middleware/authenticateAdmin");

const router = express.Router();

router.route("/positions").get(authenticateAdmin, PositionController.getAllPositions);

router
    .route("/positions")
    .post(authenticateAdmin, validateCreatePosition(), validate, PositionController.createPosition);

router.route("/positions/:positionId").get(authenticateAdmin, PositionController.getPositionById);

router
    .route("/positions/:positionId")
    .patch(authenticateAdmin, validateUpdatePosition(), validate, PositionController.updatePosition);

router.route("/positions/:positionId").delete(authenticateAdmin, PositionController.deletePosition);

module.exports = router;