const pino = require("pino");

exports.envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname"
      }
    },
    level: "debug"
  },
  production: {
    level: "debug",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      }
    }
  },
  test: {
    level: "silent"
  }
};

exports.getLoggerConfig = env => {
  return (
    this.envToLogger[env] || {
      level: "debug",
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label.toUpperCase() };
        }
      }
    }
  );
};
