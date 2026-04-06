const Sequelize = require("sequelize");
const DbConfig = require("../config/database")[process.env.NODE_ENV];

class CustomDecimal extends Sequelize.DataTypes.DECIMAL {
  static parse(value) {
    return parseFloat(value);
  }
}

const PostgresDb = new Sequelize(
  DbConfig.database,
  DbConfig.username,
  DbConfig.password,
  {
    host: DbConfig.host,
    dialect: DbConfig.dialect,
    raw: true,
    port: DbConfig.port,
    seederStorage: DbConfig.seederStorage,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 80000,
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    },
    hooks: {
      afterConnect() {
        const dTypes = {
          DECIMAL: CustomDecimal
        };
        this.connectionManager.refreshTypeParser(dTypes);
      }
    }
  }
);

PostgresDb.authenticate()
  .then(() => {
    console.log("Connection with database has been established successfully...");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
module.exports = PostgresDb;
