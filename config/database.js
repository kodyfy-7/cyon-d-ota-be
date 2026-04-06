require("dotenv").config();

module.exports = {
  developmentLocal: {
    host: process.env.LOCAL_HOSTNAME,
    database: process.env.LOCAL_DB_NAME,
    username: process.env.LOCAL_USERNAME,
    password: process.env.LOCAL_PASSWORD,
    port: process.env.LOCAL_PORT,
    seederStorage: "sequelize",
    dialect: process.env.DB_CONNECTION
  },
  developmentOnline: {
    host: process.env.DEVELOPMENT_HOSTNAME,
    database: process.env.DEVELOPMENT_DB_NAME,
    username: process.env.DEVELOPMENT_USERNAME,
    password: process.env.DEVELOPMENT_PASSWORD,
    port: process.env.DEVELOPMENT_PORT,
    seederStorage: "sequelize",
    dialect: process.env.DB_CONNECTION,
    // dialectOptions: {
    //   connectTimeout: 80000,
    //   ssl: {
    //     require: true, 
    //     rejectUnauthorized: false 
    //   }
    // },
  },

  test: {
    host: process.env.TEST_HOSTNAME,
    database: process.env.TEST_DB_NAME,
    username: process.env.TEST_USERNAME,
    password: process.env.TEST_PASSWORD,
    port: process.env.TEST_PORT,
    seederStorage: "sequelize",
    dialect: process.env.DB_CONNECTION
  },

  staging: {
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
    seederStorage: "sequelize",
    dialect: process.env.DB_CONNECTION
  },

  production: {
    host: process.env.PRODUCTION_HOSTNAME,
    database: process.env.PRODUCTION_DB_NAME,
    username: process.env.PRODUCTION_USERNAME,
    password: process.env.PRODUCTION_PASSWORD,
    port: process.env.PRODUCTION_PORT,
    seederStorage: "sequelize",
    dialect: process.env.DB_CONNECTION,
    dialectOptions: {
      connectTimeout: 80000,
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    },
  }
};
