const pino = require("pino");
const { getLoggerConfig } = require("./envToLogger");

let env = process.env.NODE_ENV || "development";

if (env === "developmentOnline") {
  env = "development";
}
const config = getLoggerConfig(env);
const logger = pino(config);

module.exports = logger;
