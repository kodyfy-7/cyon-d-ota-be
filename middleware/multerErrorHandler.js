module.exports = (err, req, res, next) => {
  if (
    err instanceof Error &&
    err.message.includes("Only images and PDF files")
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Max 10MB allowed.",
    });
  }
  next(err);
};
