const express = require("express");
const UploadController = require("../app/controllers/UploadController");
const upload = require("../middleware/multer");
const multerErrorHandler = require("../middleware/multerErrorHandler");
const { authenticateUser } = require("../middleware/authenticateUser");

const router = express.Router();

const uploadImageMiddleware = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return multerErrorHandler(err, req, res, next);
        }
        return next();
    });
};

router
    .route("/uploads/image")
    .post(authenticateUser, uploadImageMiddleware, UploadController.uploadImage);

module.exports = router;
