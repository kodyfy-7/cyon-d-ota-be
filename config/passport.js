const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Employee = require("../models/Employee");

passport.use(
  new LocalStrategy(
    { usernameField: "username" }, // use username instead of default 'username'
    async (username, password, done) => {
      try {
        const user = await User.findOne({ where: { username } });

        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, {
            message: "Invalid username or passwordm"
          });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account is inactive" });
        }

        const employee = await Employee.findOne({
          where: {
            email: user.username
          },
          attributes: ["id"]
        });

        // console.log(employee)
        // const userWithEmployeeId = {
        //   ...user.get({ plain: true }), // Convert Sequelize instance to plain object
        //   employeeId: employee ? employee.id : null,
        // };
        user.employeeId = employee ? employee.id : null;

        return done(null, user);
      } catch (err) {
        console.log(err)
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
