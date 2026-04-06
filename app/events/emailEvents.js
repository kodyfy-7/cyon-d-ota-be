const EventEmitter = require("events");
const mailGenerator = require("../../config/mail");
const approvalMailTemplate = require("../../resources/mails/approvalMail");
const newApprovalMailTemplate = require("../../resources/mails/newApprovalMail");
const credentialMailTemplate = require("../../resources/mails/credentialMail");
const { sendMail } = require("../services/MailService");

class EmailEmitter extends EventEmitter {}
const emailEmitter = new EmailEmitter();

emailEmitter.on(
  "approvalEmail",
  async ({
    approvalId,
    approverEmail,
    approverName,
    workflowName,
    employeeName,
    step,
    requestId,
    link
  }) => {
    try {
      const emailTemplate = approvalMailTemplate(
        approverName,
        employeeName,
        workflowName,
        step,
        requestId,
        link
      );
      const emailBody = mailGenerator.generate(emailTemplate);
      await sendMail(
        approverEmail,
        `Action Required: Workflow Approval Needed for ${employeeName}`,
        emailBody
      );
    } catch (error) {
      console.error(
        `Failed to send approval email to ${approverEmail}:`,
        error
      );
    }
  }
);

emailEmitter.on(
  "sendRequestApproval",
  async ({
    approverName,
    approverEmail,
    employeeName,
    name,
    requestId,
    step,
    subject,
    link,
    action
  }) => {
    try {
      const emailTemplate = newApprovalMailTemplate({
        approverName,
        employeeName,
        name,
        step,
        link,
        action
      });
      const emailBody = mailGenerator.generate(emailTemplate);
      await sendMail(approverEmail, subject, emailBody);
    } catch (error) {
      console.error(
        `Failed to send approval email to ${approverEmail}:`,
        error
      );
    }
  }
);

emailEmitter.on(
  "requestStatusEmail",
  async ({
    employeeEmail,
    employeeName,
    status,
    workflowName,
    requestId,
    step
  }) => {
    try {
      const emailTemplate = approvalMailTemplate(
        employeeName,
        status,
        workflowName,
        requestId,
        step
      );
      const emailBody = mailGenerator.generate(emailTemplate);
      let subject = "";

      if (status === "approved") {
        subject = `✅ Request Approved – ${workflowName} (ID: ${requestId})`;
      } else if (status === "rejected") {
        subject = `❌ Request Rejected – ${workflowName} (ID: ${requestId})`;
      } else if (status === "approved_step") {
        subject = `🔄 Request In Progress – Step ${step} Approved – ${workflowName}`;
      }
      await sendMail(employeeEmail, subject, emailBody);
    } catch (error) {
      console.error(
        `Failed to send approval email to ${employeeEmail}:`,
        error
      );
    }
  }
);

emailEmitter.on(
  "credentialEmail",
  async ({ employeeEmail, employeeName, defaultPassword }) => {
    try {
      const emailTemplate = credentialMailTemplate(
        employeeName,
        employeeEmail,
        defaultPassword
      );
      console.log(employeeName, employeeEmail, defaultPassword);
      const emailBody = mailGenerator.generate(emailTemplate);
      let subject = "Lorem Workflow Onboarding";

      await sendMail(employeeEmail, subject, emailBody);
    } catch (error) {
      console.error(
        `Failed to send approval email to ${employeeEmail}:`,
        error
      );
    }
  }
);

module.exports = emailEmitter;
