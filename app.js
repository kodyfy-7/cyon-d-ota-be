require("dotenv").config();
const express = require("express");
const app = express();
const Cors = require("cors");
const bodyParser = require("body-parser");
const Routes = require("./routes");
require("./models/associations");
// const { slackApp } = require("./app/services/slack");
// const WorkflowController = require("./app/controllers/WorkflowController");
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require("./config/swagger");

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";

app.disable("etag");
app.use(Cors());
app.set("trust proxy", true);

// Apply body parsers globally to parse application/json and application/x-www-form-urlencoded
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));

if (REDIS_ENABLED) {
  const queueDashboard = require("./routes/queueDashboard");
  app.use(queueDashboard);
}
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get("/api-docs.json", (req, res) => {
  res.status(200).json(swaggerSpec);
});
// Debugging middleware
// app.use((req, res, next) => {
//   // console.log('🔍 Incoming Request:', req.method, req.url, req.headers);
//   next();
// });

app.post('/', (req, res) => {
  console.log('📥 Root POST Request:', req.body);
  if (req.body && req.body.type === 'url_verification') {
    console.log('✅ Responding to url_verification at root:', req.body.challenge);
    return res.status(200).send(req.body.challenge);
  }
  res.status(404).send({ success: false, message: 'Route not found' });
});

// Slack request logger middleware
// function slackRequestLogger(req, res, next) {
//   console.log(`📨 Slack Request: ${req.method} ${req.url}`);
//   console.log("Headers:", req.headers);
//   console.log("Body:", req.body); // Log parsed body
//   req.rawBody = req.body ? JSON.stringify(req.body) : ""; // Preserve raw body for Bolt
//   next();
// }

// app.post('/api/slack/interactions', WorkflowController.testSlack);

// Other routes
app.get("/api/test/interactions", (req, res) => {
  res.status(200).send({
    status: true,
    message: "😊",
    data: { service: "Workflow", version: "1.0" },
  });
});

app.use("/api/v1", Routes);

app.get("/", (req, res) => {
  res.status(200).send({
    status: true,
    message: "😊",
    data: { service: "Lorem Events", version: "1.0" },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("lorem-workflow-logs", err);
  return res.status(500).send({ success: false, message: err.message });
});

// 404 handler
app.use((req, res) => {
  return res.status(404).send({ success: false, message: "Route not found" });
});

module.exports = app;