const axios = require("axios");
// const ApiError = require("../../models/ApiError");

const normalizeEndpoint = (endpoint) => {
  return endpoint
    .replace(/\/[a-f0-9-]{36,}\/?/gi, "/:id/") // Replace UUIDs
    .replace(/\/\d+\/?/g, "/:id/"); // Replace numeric IDs
};

const errorHandler = async (error, message, endpoint) => {
  const isProduction = process.env.APP_ENV === "production";
  const normalizedEndpoint = normalizeEndpoint(endpoint);

//   // Log error to database
//   let apiErrorId;
//   try {
//     const apiError = await ApiError.create({
//       message: error.message || message || "Unknown error", // Fallback to message param if error.message is missing
//       stackTrace: error.stack,
//       endpoint: normalizedEndpoint
//     });
//     apiErrorId = apiError.id;
//   } catch (dbError) {
//     console.error("Failed to log API error to database:", dbError);
//   }

//   if (isProduction) {
//     // Send Slack notification (even if DB fails)
//     if (process.env.SLACK_WEBHOOK_URL) {
//       try {
//         const slackMessage = {
//           text: [
//             "🚨 *Fanndrop Server API Error*",
//             `*Endpoint:* ${normalizedEndpoint}`,
//             `*Error:* ${error.message || message || "Unknown error"}`,
//             `*Time:* ${new Date().toLocaleString("en-US", {
//               timeZone: "Africa/Lagos"
//             })}`,
//             apiErrorId ? `*Resolve:* /api/errors/${apiErrorId}/resolve` : "",
//             `*Stack Trace:* \`\`\`${
//               error.stack || "No stack trace available"
//             }\`\`\``
//           ]
//             .filter(Boolean) // Remove empty lines
//             .join("\n")
//         };

//         await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
//       } catch (slackError) {
//         console.error("Failed to send Slack notification:", slackError);
//       }
//     } else {
//       console.warn("SLACK_WEBHOOK_URL not set; skipping notification");
//     }
//   }

//   if (!isProduction) {
    console.log(error);
//   }

  return {
    success: false,
    message,
    error: isProduction ? undefined : error.message
  };
};

module.exports = errorHandler;
