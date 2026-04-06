const Mailgen = require("mailgen");

const mailGenerator = new Mailgen({
  theme: "default", // Choose a theme: 'default', 'salted', or 'cerberus'
  product: {
    name: process.env.APP_NAME || "Default App Name", // Fallback to a default value if APP_NAME is not set
    link: process.env.APP_URL || "https://default-app-url.com", // Fallback to a default value if APP_URL is not set
    // logo: "https://res.cloudinary.com/kodyfy/image/upload/v1741454160/fanndrop_logo_kfr9lr.jpg"
  }
});

module.exports = mailGenerator;
