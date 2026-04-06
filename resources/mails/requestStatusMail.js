module.exports = ({ employeeName, status, workflowName, requestId, step }) => {
  let intro = "";
  let actionText = "";
  let actionLink = "";

  switch (status) {
    case "approved":
      intro = `Your request under the **${workflowName}** workflow has been fully approved.`;
      break;

    case "rejected":
      intro = `Unfortunately, your request under the **${workflowName}** workflow has been rejected.`;
      break;

    case "approved_step":
      intro = `Your request under the **${workflowName}** workflow has been approved at step ${step}. It is still in progress and awaiting further approvals.`;
      break;

    default:
      intro = `There has been an update regarding your request.`;
  }

  return {
    body: {
      name: employeeName,
      intro,
      table: {
        data: [
          {
            "Workflow": workflowName,
            "Request ID": requestId,
            ...(status === "approved_step" && { "Current Step": step })
          }
        ],
        columns: {
          customWidth: { Workflow: '30%', "Request ID": '30%', "Current Step": '30%' },
          customAlignment: { Workflow: 'left', "Request ID": 'center', "Current Step": 'center' }
        }
      },
      outro: "If you have any questions, please contact your HR or system administrator."
    }
  };
};
