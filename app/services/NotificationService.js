const emailEmitter = require("../events/emailEvents");

exports.sendNotification = async ({
  userId,
  approverName,
  approverEmail,
  step,
  employeeName,
  name,
  requestId,
  action,
  platform,
  subject
}) => {
  // no need for switch, except you need different templates
  switch (action) {
    case "leave-request":
      emailEmitter.emit("sendRequestApproval", {
        userId,
        approverName,
        approverEmail,
        employeeName,
        name,
        requestId,
        step,
        action,
        platform,
        subject,
        link: "hr.gamequiz.live"
      });
      break;
    case "loan-request":
      emailEmitter.emit("sendRequestApproval", {
        userId,
        approverName,
        approverEmail,
        employeeName,
        name,
        requestId,
        step,
        action,
        platform,
        subject,
        link: "hr.gamequiz.live"
      });
      break;

    default:
      console.log(`No handler for action: ${action}`);
      break;
  }
};
