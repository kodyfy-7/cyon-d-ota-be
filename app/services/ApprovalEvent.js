const ActionEvent = require("../../models/ActionEvent");
const Workflow = require("../../models/Workflow");
const WorkflowApprover = require("../../models/WorkflowApprover");
const ApprovalStep = require("../../models/ApprovalStep");
const LeaveRequest = require("../../models/LeaveRequest");
const { Op } = require("sequelize");
const Employee = require("../../models/Employee");
const LoanRequest = require("../../models/LoanRequest");
const NotificationService = require("./NotificationService");

exports.approveRequest = async (data, transaction) => {
  try {
    const {
      requestId,
      status,
      currentStep,
      userId,
      actionSlug,
      platform = "admin",
      name = "Request"
    } = data;

    let request;
    // Handle specific approval logic based on actionSlug
    switch (actionSlug) {
      case "leave-request":
        request = await LeaveRequest.findOne({
          where: { id: requestId },
          include: [
            {
              model: Employee,
              as: "employee"
            }
          ]
        });
        break;
      case "loan-request":
        request = await LoanRequest.findOne({
          where: { id: requestId },
          include: [
            {
              model: Employee,
              as: "employee"
            }
          ]
        });
        break;
      default:
        // Generic approval (no additional logic needed)
        break;
    }

    if (!request) {
      throw new Error(`Request with ID ${requestId} not found in transaction`);
    }

    // Update ApprovalStep status for the current step
    let stepStatus = "pending";
    if (currentStep) {
      stepStatus = status === "approved" ? "approved" : "rejected";
      const stepUpdate = await ApprovalStep.update(
        { status: stepStatus },
        { where: { requestId, sequenceNo: currentStep }, transaction }
      );
      if (!stepUpdate[0]) {
        throw new Error(
          `ApprovalStep with requestId ${requestId} and sequenceNo ${currentStep} not found`
        );
      }
    }

    // Check approval steps
    const approvalSteps = await ApprovalStep.findAll({
      where: { requestId },
      include: [
        {
          model: Employee,
          as: "approver",
          attributes: ["id", "firstName", "lastName"]
        }
      ],
      transaction
    });

    // Determine final request status
    let requestStatus = "pending";
    if (status === "disapproved") {
      requestStatus = "disapproved";
    } else {
      const allStepsApproved = approvalSteps.every(
        (step) => step.status === "approved"
      );
      const hasPendingSteps = approvalSteps.some(
        (step) => step.status === "pending"
      );
      const isFinalStep =
        currentStep &&
        approvalSteps.length > 0 &&
        currentStep ===
          Math.max(...approvalSteps.map((step) => step.sequenceNo));

      if (
        allStepsApproved ||
        (isFinalStep && status === "approved" && !hasPendingSteps)
      ) {
        requestStatus = "approved";
      }
    }

    // Update Request status
    await request.update({ approvalStatus: requestStatus }, { transaction });

    // use switch if necessary to interact with request action modal

    // Check if approval process is complete
    const isApprovalComplete =
      requestStatus === "approved" || requestStatus === "disapproved";

    // If approval is not complete, notify the next approver
    if (!isApprovalComplete) {
      const nextStep = approvalSteps
        .filter((step) => step.status === "pending")
        .sort((a, b) => a.sequenceNo - b.sequenceNo)[0];

      if (nextStep) {
        await NotificationService.sendNotification({
          userId: nextStep.approverId,
          approverName: nextStep.approver.firstName,
          approverEmail: nextStep.approver.email,
          step: nextStep.sequenceNo,
          employeeName: request.employee.firstName,
          name,
          requestId,
          action: actionSlug,
          subject: `Your approval is required for request: ${request.employee.fname}`
        });
      }
    }

    return { success: true, isApprovalComplete, requestStatus };
  } catch (error) {
    console.error(`Error in approveLeaveRequest for request`, error);
    throw new Error(`Failed to process request: ${error.message}`);
  }
};

