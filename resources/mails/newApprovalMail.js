module.exports = ({
  approverName,
  employeeName,
  name,
  action,
  step,
  link
}) => {
  return {
    body: {
      greeting: false,
      signature: false,
      intro: [
        `Dear ${approverName},`,
        `You have a new ${name} request to approve.`,
        `Submitted by: <strong>${employeeName}</strong>`,
        `Approval Step: <strong>${step}</strong>`,
        `Click the button below to login and navigate to My Approvals to review the request:`
      ],
      action: {
        instructions: 'Review and take action on this request:',
        button: {
          color: '#22BC66',
          text: 'Login',
          link: link
        }
      },
      outro: [
        "If you have any questions, please contact the admin team.",
      ]
    }
  };
};
