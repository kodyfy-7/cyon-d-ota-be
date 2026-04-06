module.exports = (
  approverName,
  employeeName,
  workflowName,
  step,
  requestId,
  link
) => {
  return {
    body: {
      greeting: false,
      signature: false,
      intro: [
        `Dear ${approverName},`,
        `You have a new request to approve in the <strong>${workflowName}</strong> workflow.`,
        `Submitted by: <strong>${employeeName}</strong>`,
        `Approval Step: <strong>${step}</strong>`,
        `Request ID: <strong>${requestId}</strong>`,
        `Click the button below to review and approve the request:`
      ],
      action: {
        instructions: 'Review and take action on this request:',
        button: {
          color: '#22BC66',
          text: 'Approve Request',
          link: link
        }
      },
      outro: [
        "If you have any questions, please contact the admin team.",
        "<strong>Powered by the Workflow System</strong>"
      ]
    }
  };
};
