const { uploadBase64ImageToAWS } = require("../services/AwsService");
const SnapShotEvidence = require("../../models/SnapShotEvidence");
const UserExam = require("../../models/UserExam");

exports.uploadSnapshots = async (req, res) => {
  try {
    const { user_id, user_exam_id, timestamp, captures } = req.body;

    // Validate required fields
    if (!user_id || !user_exam_id || !captures?.length) {
      return res.status(400).json({
        message: "Missing required field(s): user_id, user_exam_id, or captures",
      });
    }

    // Verify exam belongs to user
    const userExam = await UserExam.findOne({ where: { id: user_exam_id } });
    if (!userExam) {
      return res
        .status(403)
        .json({ message: "Unauthorized or invalid exam session" });
    }

    // Process all captures
    const records = [];
    for (const c of captures) {
      if (!c.label || !c.image) continue;

      // Upload to AWS if image is base64
      let fileUrl = c.image;
      if (c.image.startsWith("data:image")) {
        fileUrl = await uploadBase64ImageToAWS(c.image, `${user_id}/${c.label}.jpg`);
      }

      const record = await SnapShotEvidence.create({
        user_id,
        user_exam_id,
        label: c.label,
        image: fileUrl,
        timestamp: timestamp || new Date(),
      });

      records.push({
        label: record.label,
        image: record.image,
      });
    }

    res.status(201).json({
      message: "Snapshots uploaded successfully",
      user_id,
      user_exam_id,
      timestamp,
      captures: records,
    });
  } catch (err) {
    console.error("Snapshots upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

const express = require("express");
const router = express.Router();
const { uploadSnapshots } = require("../app/controllers/snapshotController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer"); // ⬅️ You need to install and require multer

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

router.post("/snapshots/upload", upload.single("file"), uploadSnapshots);

module.exports = router;


const { uploadFileToAWS } = require("../services/AwsService");

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select a file" });
    }

    const url = await uploadFileToAWS(req.file);
    return res.status(201).json({
      success: true,
      data: url,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error(error);
    return next({
      status: 500,
      message: error.message,
    });
  }
};

const AWS = require("aws-sdk");
const mime = require("mime-types");
AWS.config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
  signatureVersion: "v4",
});
const { v4: uuidv4 } = require("uuid");

var s3 = new AWS.S3({ region: "eu-west-2", signatureVersion: "v4" });

exports.uploadFileToAWS = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    const bucketName = "public-ng";
    const folderPath = "testassessify/assets/";
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const contentType = mime.lookup(file.originalname) || "application/octet-stream";

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(contentType)) {
      throw new Error("Invalid file type");
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: `${folderPath}${uniqueFileName}`,
      Body: file.buffer,
      ContentType: contentType,
      ContentDisposition: "inline",
    };

    const response = await s3.upload(uploadParams).promise();
    return response.Location;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

exports.uploadBase64ImageToAWS = async (base64String, userExamId) => {
  try {
    if (!base64String) {
      throw new Error("No image provided");
    }

    const bucketName = "public-ng";
    const folderPath = `testassessify/snapshots/${userExamId}/`;
    const uniqueFileName = `${uuidv4()}.jpg`;

    // Convert base64 → buffer
    const base64Data = Buffer.from(
      base64String.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const uploadParams = {
      Bucket: bucketName,
      Key: `${folderPath}${uniqueFileName}`,
      Body: base64Data,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
      ContentDisposition: "inline",
    };

    const response = await s3.upload(uploadParams).promise();
    return response.Location;
  } catch (error) {
    console.error("Base64 S3 upload error:", error);
    throw error;
  }
};
