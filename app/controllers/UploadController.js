"use strict";

const errorHandler = require("../../middleware/errorHandler");
const { uploadToCloudinary } = require("../../config/cloudinary");

const sanitizeFolder = (value = "") =>
    String(value)
        .trim()
        .replace(/[^a-zA-Z0-9/_-]/g, "")
        .replace(/\/+/g, "/");

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please provide an image file using field name 'file'."
            });
        }

        if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({
                success: false,
                message: "Only image uploads are allowed."
            });
        }

        const target = sanitizeFolder(req.body.folder) || "sacc-be/images";
        const result = await uploadToCloudinary(req.file.buffer, target);

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                fileUrl: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error uploading image", req.originalUrl));
    }
};
