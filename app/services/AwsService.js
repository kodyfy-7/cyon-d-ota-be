const AWS = require("aws-sdk");
const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");

AWS.config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
  signatureVersion: "v4"
});

const s3 = new AWS.S3({
  region: process.env.AWS_DEFAULT_REGION || "eu-west-2",
  signatureVersion: "v4"
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "public-ng";

const uploadFileToAWS = async (file, folderPath = "testassessify/assets/") => {
  if (!file) {
    throw new Error("No file provided");
  }

  const contentType =
    file.mimetype || mime.lookup(file.originalname || "") || "application/octet-stream";

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
  if (!allowedTypes.includes(contentType)) {
    throw new Error("Invalid file type");
  }

  const uniqueFileName = `${uuidv4()}-${file.originalname || "asset"}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: `${folderPath}${uniqueFileName}`,
    Body: file.buffer,
    ContentType: contentType,
    ContentDisposition: "inline"
  };

  const response = await s3.upload(uploadParams).promise();
  return response.Location;
};

const uploadBase64ImageToAWS = async (
  base64String,
  subFolder = "general",
  mimeType = "image/jpeg"
) => {
  if (!base64String) {
    throw new Error("No image provided");
  }

  const folderPath = `testassessify/snapshots/${subFolder}/`;
  const extension = mime.extension(mimeType) || "jpg";
  const uniqueFileName = `${uuidv4()}.${extension}`;

  const normalizedBase64 = base64String.replace(/^data:image\/\w+;base64,/, "");
  const base64Data = Buffer.from(normalizedBase64, "base64");

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: `${folderPath}${uniqueFileName}`,
    Body: base64Data,
    ContentEncoding: "base64",
    ContentType: mimeType,
    ContentDisposition: "inline"
  };

  const response = await s3.upload(uploadParams).promise();
  return response.Location;
};

module.exports = {
  uploadFileToAWS,
  uploadBase64ImageToAWS
};
