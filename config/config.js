const dotenv = require("dotenv").config();

const {
  PRODUCTION_USERNAME,
  PRODUCTION_PASSWORD,
  PRODUCTION_DB_NAME,
  PRODUCTION_HOSTNAME,
  PRODUCTION_PORT,
  LOCAL_USERNAME,
  LOCAL_PASSWORD,
  LOCAL_DB_NAME,
  LOCAL_HOSTNAME,
  LOCAL_PORT,
  DIALECT,
  SEEDER_STORAGE
} = process.env;
console.log(PRODUCTION_USERNAME,
  PRODUCTION_PASSWORD,
  PRODUCTION_DB_NAME,
  PRODUCTION_HOSTNAME,
  PRODUCTION_PORT,)
module.exports = {
  development: {
    username: LOCAL_USERNAME,
    password: LOCAL_PASSWORD,
    database: LOCAL_DB_NAME,
    host: LOCAL_HOSTNAME,
    dialect: "postgres",
    logging: console.log,
    pool: {
      max: 100,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  },
  test: {
    username: PRODUCTION_USERNAME,
    password: PRODUCTION_PASSWORD,
    database: PRODUCTION_DB_NAME,
    host: PRODUCTION_HOSTNAME,
    port: PRODUCTION_PORT,
    dialect: "postgres",
    seederStorage: SEEDER_STORAGE,
    appPort: process.env.APP_PORT
  },
  staging: {
    username: PRODUCTION_USERNAME,
    password: PRODUCTION_PASSWORD,
    database: PRODUCTION_DB_NAME,
    host: PRODUCTION_HOSTNAME,
    port: PRODUCTION_PORT,
    dialect: "postgres",
    seederStorage: SEEDER_STORAGE,
    appPort: process.env.APP_PORT
  },
  production: {
    username: PRODUCTION_USERNAME,
    password: PRODUCTION_PASSWORD,
    database: PRODUCTION_DB_NAME,
    host: PRODUCTION_HOSTNAME,
    port: PRODUCTION_PORT,
    dialect: "postgres",
    seederStorage: SEEDER_STORAGE,
    appPort: process.env.APP_PORT,
    dialectOptions: {
      connectTimeout: 80000,
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    },
  }
};
