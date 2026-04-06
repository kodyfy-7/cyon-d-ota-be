const nodemailer = require("nodemailer");
const Postal = require("@atech/postal");

const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST;
const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
const smtpUser = process.env.SMTP_USER || process.env.MAIL_USERNAME;
const smtpPassword = process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD;
const mailEncryption = (process.env.MAIL_ENCRYPTION || "").toLowerCase();

const shouldUseSecureSmtp =
  String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
  smtpPort === 465 ||
  mailEncryption === "ssl";

// SMTP Transporter Setup
const transporter =
  smtpHost && smtpUser && smtpPassword
    ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: shouldUseSecureSmtp,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    })
    : null;

exports.sendMail = async (recipient, subject, emailBody) => {
  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || smtpUser;
    const fromName =
      process.env.EMAIL_FROM_NAME ||
      process.env.MAIL_FROM_NAME ||
      process.env.APP_NAME ||
      "SACC";
    const fromEmailAddress = `"${fromName}" <${fromEmail}>`;
    const emailServer = (process.env.EMAIL_SERVER || "smtp").toLowerCase();

    if (!recipient) {
      throw new Error("Recipient email is required");
    }

    if (emailServer === "postal") {
      const client = new Postal.Client(
        process.env.POSTAL_USER,
        process.env.POSTAL_SECRET
      );

      const message = new Postal.SendMessage(client);

      // Add recipients
      message.to(recipient);

      // Specify the sender (must be from a verified domain)
      message.from(fromEmailAddress);
      // Set the subject of the email
      message.subject(subject);

      // Set the email content (both plain text and HTML)
      message.plainBody(emailBody);
      message.htmlBody(emailBody);

      try {
        // Send the email and log the results
        const result = await message.send();
        const recipients = result.recipients();

        // Log message IDs and tokens for each recipient
        // for (const email in recipients) {
        //   const recipient = recipients[email];
        //   console.log("Message ID:", recipient.id()); // Logs message ID
        //   console.log("Message Token:", recipient.token()); // Logs message token
        // }
        return true;
      } catch (error) {
        console.log(error);
        throw error;
      }
    } else {
      if (!transporter) {
        throw new Error(
          "SMTP is not configured. Set SMTP_* or MAIL_* environment variables."
        );
      }

      return transporter.sendMail({
        from: fromEmailAddress,
        to: recipient,
        subject,
        html: emailBody
      });
    }
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error; // Re-throw the error for the caller to handle
  }
};
