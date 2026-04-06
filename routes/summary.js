const express = require("express");
const PublicController = require("../app/controllers/PublicController");

const router = express.Router();

router.route("/summary").get(PublicController.getPublicSummary);

module.exports = router;
