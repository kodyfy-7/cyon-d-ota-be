const ActionEvent = require("../../models/ActionEvent");
const ApprovalStep = require("../../models/ApprovalStep");
const Workflow = require("../../models/Workflow");
const WorkflowApprover = require("../../models/WorkflowApprover");
const ApprovalEvent = require("./ApprovalEvent");
const emailEmitter = require("../events/emailEvents");
const NotificationService = require("../services/NotificationService")
const { Op } = require("sequelize");
const Employee = require("../../models/Employee");

exports.initiateApprovalRequest = async ({
  req = {}, // Default to empty object to handle queue context
  userId,
  functionId,
  orgId,
  action,
  requestId,
  name,
  employeeName,
  transaction = null
}) => {
  try {

    console.log("---> data:", name, employeeName)
    // Fetch workflow approvers
    const eventApprovers = await WorkflowApprover.findAll({
      where: { functionId },
      include: [
        {
          model: Workflow,
          as: "workflow",
          where: { orgId },
          include: [
            {
              model: ActionEvent,
              as: "event",
              where: { slug: action },
              required: true
            }
          ],
          required: true
        },
        {
          model: Employee,
          as: "approver",
          attributes: ["id", "firstName", "email"]
        }
      ],
      order: [["step", "ASC"]],
      transaction
    });
    console.log("----> eventApprovers:", eventApprovers)
    // If no approvers found, approve the request automatically
    if (!eventApprovers.length) {
      await exports.approveAllRequest(req, {
        status: "approved",
        actionSlug: action,
        requestId,
        transaction
      });
      return true;
    }

    // Create ApprovalStep records for each approver
    const stepRecords = await Promise.all(
      eventApprovers.map(async (approver, index) => {
        const stepData = {
          requestId,
          sequenceNo: approver.step,
          status: "pending",
          action,
          approverId: approver.approverId,
          initiatorId: userId,
          orgId
        };

        const [approvalStep, created] = await ApprovalStep.findOrCreate({
          where: { requestId, sequenceNo: approver.step },
          defaults: stepData,
          transaction
        });

        return approvalStep;
      })
    );

    // Check if user is one of the approvers
    const userApprover = eventApprovers.find(
      (approver) => approver.approverId === userId
    );

    if (userApprover) {
      // User is part of the workflow
      const outrankedBy = eventApprovers.filter(
        (a) => a.step > userApprover.step
      );
      const outranks = eventApprovers.filter((a) => a.step < userApprover.step);

      // If no one outranks the user (highest approver)
      if (!outrankedBy.length) {
        console.log("no ranking by");
        // Update request status
        await this.approveAllRequest(req, {
          status: "approved",
          actionSlug: action,
          requestId,
          transaction
        });

        // Update ApprovalStep status for the current approver
        await ApprovalStep.update(
          { status: "approved" },
          {
            where: {
              requestId,
              approverId: userApprover.approverId
            },
            transaction
          }
        );

        // Update ApprovalStep status for all outranked approvers
        if (outranks.length) {
          await ApprovalStep.update(
            { status: "approved" },
            {
              where: {
                requestId,
                approverId: { [Op.in]: outranks.map((a) => a.approverId) }
              },
              transaction
            }
          );
        }

        return true;
      } else {
        // Check if prior steps are approved before allowing current user to approve
        const priorSteps = await ApprovalStep.findAll({
          where: {
            requestId,
            sequenceNo: { [Op.lt]: userApprover.step }
          },
          transaction
        });

        if (priorSteps.every((step) => step.status === "approved")) {
          // Update ApprovalStep status for the current approver
          await ApprovalStep.update(
            { status: "approved" },
            {
              where: {
                requestId,
                approverId: userApprover.approverId
              },
              transaction
            }
          );

          // Notify the next approver (lowest step among outrankedBy)
          const nextApprover = outrankedBy.reduce((prev, curr) =>
            prev.step < curr.step ? prev : curr
          );

          await NotificationService.sendNotification({
            userId: nextApprover.approverId,
            approverName: nextApprover.approver.firstName,
            approverEmail: nextApprover.approver.email,
            step: nextApprover.step,
            employeeName,
            name,
            requestId,
            action,
            subject: `Your approval is required for request: ${employeeName}`
          });
        } else {
          // Prior steps not approved, notify user
          //   await NotificationService.notify({
          //     userId,
          //     requestId,
          //     action,
          //     platform,
          //     message: `Cannot approve request: ${name}. Prior approvals are pending.`,
          //     recipientId: recipientId || userId
          //   });
        }

        return true;
      }
    }

    // User is not part of workflow, notify the first approver
    const firstApprover = eventApprovers[0];
    console.log("---> firstApprover:", firstApprover);

    await NotificationService.sendNotification({
      userId: firstApprover.approverId,
      approverName: firstApprover.approver.firstName,
      approverEmail: firstApprover.approver.email,
      step: firstApprover.step,
      employeeName,
      name,
      requestId,
      action,
      subject: `Your approval is required for request: ${employeeName}`
    });

    return true;
  } catch (error) {
    console.error("Error in initiateApprovalRequest:", error);
    throw new Error(`Failed to initiate approval request: ${error.message}`);
  }
};

exports.approveAllRequest = async (req, data, transaction) => {
  try {
    console.log("start approve all request");
    const { actionSlug, status, requestId } = data;

    // Validate inputs
    if (!requestId || !status || !actionSlug) {
      throw new Error("Missing required fields: requestId and status");
    }
    if (!["approved", "disapproved"].includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    if (currentStep && !Number.isInteger(currentStep)) {
      throw new Error(`Invalid currentStep: ${currentStep}`);
    }

    await ApprovalEvent.approveRequest(data, transaction);

    return {
      success: true,
      message: `Request ${requestId} approved successfully`
    };
  } catch (error) {
    console.error("Error in approveAllRequest:", error);
    throw new Error(`Failed to approve request: ${error.message}`);
  }
};


// for reference
// require("dotenv").config();
// const { Op } = require("sequelize");
// const moment = require("moment");
// const AdvanceAndLoanRequest = require("../../../models/advance_and_loans/AdvanceAndLoanRequest");
// const LeaveRequest = require("../../../models/leave/LeaveRequest");
// const OvertimeRequest = require("../../../models/overtime/OvertimeRequest");
// const PayrunEmployees = require("../../../models/payroll/PayrunEmployees");
// const EmployeeVariablePay = require("../../../models/paysetting/EmployeeVariablePay");
// const Payrun = require("../../../models/payroll/Payrun");
// const { globalAuth } = require("../GlobalAuth/actions");
// const scheduler = require("../../helpers/scheduler");
// const {
//   nextMonth,
//   convertDateFormatMonthFirst
// } = require("../../helpers/dates");
// const Employee = require("../../../models/Employee");
// const CompensationReview = require("../../../models/compensation/CompensationReview");
// const ConfirmationProbationRating = require("../../../models/actionsettings/ConfirmationProbationRating");
// const PromoteEmployee = require("../../../models/EmployeeAction/PromoteEmployee");
// const EmployeeConfirmation = require("../../../models/EmployeeAction/EmployeeConfirmation");
// const Redeployment = require("../../../models/EmployeeAction/Redeployment");
// const DelegationManagement = require("../../../models/EmployeeAction/DelegationManagement");
// const SuspendEmployee = require("../../../models/EmployeeAction/SuspendEmployee");
// const NotificationService = require("../NotificationService/notification");
// const EmployeeActionService = require("../EmployeeActionService/employee_action");
// const ReviseSalary = require("../../../models/EmployeeAction/ReviseSalary");
// const ReengageEmployee = require("../../../models/EmployeeAction/ReengageEmployee");
// const UnsuspendEmployee = require("../../../models/EmployeeAction/UnsuspendEmployee");
// const ReviewRequest = require("../../../models/compensation/ReviewRequest");
// const PayGradeApproval = require("../../../models/compensation/PayGradeApproval");
// const PayGradeService = require("../Compensation/PayGradeService");
// const LeaveBackRequest = require("../../../models/leave/LeaveBackRequest");
// const InitiateApprovalAction = require("./InitiateApprovalAction");
// const PayPreference = require("../../../models/paysetting/PayPreference");
// const User = require("../../../models/GlobalAuth/User");

// const effectiveDate = moment()
//   .add(3, "seconds")
//   .toDate();

// exports.approveLeaveRequest = async (data, t) => {
//   const { requestId, recipientId, initiatorId, orgId, ...others } = data;

//   const leave = await LeaveRequest.findOne({
//     where: { id: requestId },
//     transaction: t
//   });
//   leave.approvalStatus = "approved";
//   leave.approvalBy = initiatorId;

//   await leave.save({ transaction: t });

//   const requestDetail = {
//     effectiveDate,
//     requestId,
//     userId: recipientId,
//     delegate: {
//       id: leave.delegationUserId,
//       start: leave.requestStartDate,
//       end: leave.requestEndDate
//     }
//   };
//   await scheduler.scheduleLeave({ requestDetail });

//   await NotificationService.sendApprovalStatusNotification({
//     userId: recipientId,
//     payload: {
//       orgId,
//       ...others,
//       requestName: "Employee Leave",
//       actionSlug: "requestForLeave"
//     }
//   });
//   return true;
// };

// // Approve Overtime Request
// exports.approveOvertimeRequest = async (data, t) => {
//   const { requestId, initiatorId, orgId, ...others } = data;

//   await OvertimeRequest.update(
//     { preApprovalStatus: "approved", preApprovedBy: initiatorId },
//     { where: { id: requestId }, transaction: t }
//   );

//   await NotificationService.sendApprovalStatusNotification({
//     userId: initiatorId,
//     payload: {
//       orgId,
//       ...others,
//       requestName: "Employee Overtime",
//       actionSlug: "requestForOvertimeWork"
//     }
//   });
//   // Todo: since Final approval is done Send to Pay Request
//   return true;
// };

// // Approve Overtime Pay Request
// exports.approveOvertimePayRequest = async (data, t) => {
//   const { recipientId, initiatorId, requestId, orgId, ...others } = data;

//   const { id } = await Employee.findOne({
//     attributes: ["id"],
//     where: { userId: recipientId },
//     transaction: t
//   });
//   const requestDetail = {
//     managerUserId: initiatorId,
//     userId: initiatorId,
//     employeeId: id,
//     payApprovalStatus: "approved",
//     requestIds: requestId
//   };

//   await scheduler.scheduleOvertimePayRequest({ requestDetail, effectiveDate });

//   await NotificationService.sendApprovalStatusNotification({
//     userId: recipientId,
//     payload: {
//       orgId,
//       ...others,
//       requestName: "Overtime Pay",
//       actionSlug: "requestForOvertimePay"
//     }
//   });
//   return true;
// };

// // Approve Advance Request
// exports.approveAdvanceRequest = async (data, t) => {
//   const { requestId, initiatorId, recipientId, orgId, ...others } = data;

//   await AdvanceAndLoanRequest.update(
//     { approvalStatus: "approved", approvalBy: initiatorId },
//     { where: { id: requestId, type: "advance" }, transaction: t }
//   );

//   // Todo: since Final approval is done Send to Pay Request
//   // If the requests are approved, add the approved leave requests
//   // get employee id using userId
//   const { id } = await Employee.findOne({
//     attributes: ["id"],
//     where: { userId: initiatorId },
//     transaction: t
//   });
//   const requestDetail = {
//     managerUserId: initiatorId,
//     userId: initiatorId,
//     employeeId: id,
//     approvalStatus: "approved",
//     requestId
//   };

//   // approve requests and add it to variable pay
//   await scheduler.scheduleAdvanceRequest({ requestDetail, effectiveDate });

//   await NotificationService.sendApprovalStatusNotification({
//     userId: recipientId,
//     payload: {
//       orgId,
//       ...others,
//       requestName: "Advance Loan",
//       actionSlug: "requestForAdvance"
//     }
//   });
//   return true;
// };

// // Approve Loan Request
// exports.approveLoanRequest = async (data, t) => {
//   const { requestId, initiatorId, recipientId, orgId, ...others } = data;

//   await AdvanceAndLoanRequest.update(
//     { approvalStatus: "approved", approvalBy: initiatorId },
//     { where: { id: requestId, type: "loan" }, transaction: t }
//   );

//   // Todo: since Final approval is done Send to Pay Request
//   // If the requests are approved, add the approved leave requests
//   // get employee id using userId
//   const { id } = await Employee.findOne({
//     attributes: ["id"],
//     where: { userId: initiatorId },
//     transaction: t
//   });
//   const requestDetail = {
//     managerUserId: initiatorId,
//     userId: initiatorId,
//     employeeId: id,
//     approvalStatus: "approved",
//     requestId
//   };

//   // approve requests and add it to variable pay
//   await scheduler.scheduleLoanRequest({ requestDetail, effectiveDate });

//   await NotificationService.sendApprovalStatusNotification({
//     userId: recipientId,
//     payload: {
//       orgId,
//       ...others,
//       requestName: "Loan",
//       actionSlug: "requestForLoan"
//     }
//   });
//   return true;
// };

// // Approve Compensation Review
// exports.approveCompensationReview = async (data, t) => {
//   const { requestId } = data;

//   await CompensationReview.update(
//     { status: "in_progress" },
//     { where: { id: requestId }, transaction: t }
//   );
//   // TODO: since Final approval is done Send to initiate salary increment
// };

// // Approve PayRun Request
// exports.approvePayRun = async (data, t) => {
//   try {
//     const { requestId, initiatorId, emailOnly, ...others } = data;

//     const payrunFromDb = JSON.parse(
//       JSON.stringify(
//         await Payrun.findOne({
//           where: { id: requestId },
//           include: [
//             {
//               model: PayrunEmployees,
//               as: "employees",
//               include: [
//                 {
//                   model: Employee,
//                   as: "employee",
//                   attributes: ["userId", "receipientCode"]
//                 }
//               ]
//             }
//           ],
//           transaction: t
//         })
//       )
//     );

//     if (!payrunFromDb) {
//       return false;
//     }

//     const approval = await User.findByPk(initiatorId, {
//       attributes: ["fname", "lname", "photo"]
//     });

//     const currentApprovals = payrunFromDb.approvalTrail;

//     const newApproval = {
//       photo: approval.photo || null,
//       name: `${approval.fname} ${approval.lname}`,
//       date: moment().format(),
//       status: "approved"
//     };

//     const approvalTrail = [...currentApprovals, newApproval];

//     await Payrun.update(
//       {
//         payrollStatus: "approved",
//         approvalTrail
//       },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     // Todo: since Final approval is done Add to employee Varaible pay
//     const employeeIds = [
//       ...new Set(payrunFromDb.employees.map(employee => employee.employeeId))
//     ];

//     // get pay Preference setting and check if emailonly works
//     const payPreference = await PayPreference.findOne({
//       where: {
//         orgId: payrunFromDb.orgId
//       }
//     });

//     if (
//       payPreference &&
//       payPreference.generateOnApproval &&
//       (payPreference.inAppNotification || payPreference.emailNotification)
//     ) {
//       const modifyEmailOnly =
//         !payPreference.inAppNotification && payPreference.emailNotification;

//       await Promise.all(
//         employeeIds.map(async employeeId => {
//           const employee = await Employee.findOne({
//             where: { id: employeeId }
//           });

//           if (employee) {
//             const monthName = moment(payrunFromDb.month, "M").format("MMMM");
//             const emailData = {
//               userId: employee.userId,
//               orgId: payrunFromDb.orgId,
//               name: "Payslip",
//               senderId: employee.userId,
//               action: "payslipPayment",
//               description: `Your payslip for the ${monthName}/${payrunFromDb.year} pay run cycle is now available on Cloudenly`,
//               emailOnly: modifyEmailOnly,
//               period: `${monthName}/${payrunFromDb.year}`
//             };
//             await NotificationService.sendPayrollNotificationToEmployee(
//               null,
//               emailData
//             );
//           }
//         })
//       );
//     }

//     const currentMonttVariablePays = await EmployeeVariablePay.findAll({
//       where: {
//         employeeId: employeeIds,
//         month: payrunFromDb.month,
//         year: payrunFromDb.year,
//         amountDue: { [Op.gt]: 0 }
//       },
//       raw: true
//     });

//     const { nextYear, nextMonth: month } = nextMonth({
//       year: payrunFromDb.year,
//       month: payrunFromDb.month
//     });
//     const nextMonttVariablePays = await EmployeeVariablePay.findAll({
//       where: {
//         employeeId: employeeIds,
//         month,
//         year: nextYear
//       },
//       raw: true
//     });

//     await Promise.all(
//       currentMonttVariablePays.map(async variablePay => {
//         const existingVariablePay = nextMonttVariablePays.find(
//           nextVariablePay =>
//             nextVariablePay.paySettingId === variablePay.paySettingId &&
//             nextVariablePay.employeeId === variablePay.employeeId
//         );
//         //  Update employees variable pay for next month
//         if (existingVariablePay) {
//           // update existing variable pay
//           await EmployeeVariablePay.update(
//             {
//               amountDue: existingVariablePay.amountDue + variablePay.amountDue,
//               outstandingAmount:
//                 existingVariablePay.outstandingAmount + variablePay.amountDue
//             },
//             {
//               where: {
//                 id: existingVariablePay.id
//               },
//               transaction: t
//             }
//           );
//         } else {
//           // create new variable pay
//           await EmployeeVariablePay.create(
//             {
//               settingType: variablePay.settingType,
//               employeeId: variablePay.employeeId,
//               paySettingId: variablePay.paySettingId,
//               month,
//               year: nextYear,
//               amountDue: variablePay.amountDue,
//               outstandingAmount: variablePay.amountDue
//             },
//             {
//               transaction: t
//             }
//           );
//         }
//       })
//     );

//     const message = "Your Pay Run request has been treated";

//     await NotificationService.sendApprovalStatusNotification({
//       userId: payrunFromDb.createdBy,
//       payload: {
//         message,
//         ...others,
//         orgId: payrunFromDb.orgId,
//         requestName: "Pay Run",
//         actionSlug: "approvePayRun"
//       }
//     });

//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// exports.approveEmployeePromotion = async (data, req, t) => {
//   try {
//     const { requestId, initiatorId, recipientId, orgId, ...others } = data;
//     const { authorization } = req.headers;

//     // Update employees promote status
//     await PromoteEmployee.update(
//       { approvalInitiated: true, status: "approved", approvedBy: initiatorId },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     const promote = await PromoteEmployee.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     await scheduler.schedulePromoteEmployee({
//       dataValues: promote,
//       authorization
//     });

//     const designation = await globalAuth.AAA.getDesignation(
//       promote.newDesignationId
//     );
//     const newDesignation = designation.name;

//     const promotionDate = moment(promote.effectiveDate).format("DD/MM/YYYY");

//     const message = `Congratulations!!!, you have been promoted to the role of ${newDesignation} with effect from ${promotionDate}.`;

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         message,
//         ...others,
//         date: moment(),
//         app: "humanar",
//         type: "promotion",
//         newDesignation,
//         categoryType: "Extension",
//         start: promote.effectiveDate,
//         senderId: req.headers.userid,
//         requestName: "Promotion",
//         actionSlug: "employeePromotion"
//       }
//     });
//     return true;
//   } catch (err) {
//     return err;
//   }
// };

// exports.approveEmployeeConfirmation = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;
//     const { authorization } = req.headers;

//     await EmployeeConfirmation.update(
//       { status: "approved" },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     const confirm = await EmployeeConfirmation.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     await scheduler.scheduleConfirmEmployee({
//       dataValues: confirm,
//       authorization
//     });

//     // notification
//     const orgData = await globalAuth.AAA.getOrgDetails(confirm.orgId);

//     const { designationId } = await Employee.findOne({
//       attributes: ["designationId"],
//       where: { userId: recipientId },
//       transaction: t
//     });

//     const designation = await globalAuth.AAA.getDesignation(designationId);
//     const desc = designation.name;

//     const articleType = NotificationService.determineArticle(desc);
//     const start = convertDateFormatMonthFirst(confirm.effectiveDate);

//     const message = `Congratulations! Your employment as ${articleType} ${desc} has been officially confirmed, effective from ${start}.`;

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         desc,
//         orgId,
//         ...others,
//         message,
//         articleType,
//         type: "confirm",
//         isNotifyManager: "true",
//         reportTo: designation.reportingTo,
//         company: orgData.org.name,
//         start: confirm.effectiveDate,
//         requestName: "Employment confirmation",
//         actionSlug: "employeeConfirmation"
//       }
//     });

//     return true;
//   } catch (err) {
//     return err;
//   }
// };

// exports.approveEmployeeProbationExtension = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;
//     const { authorization } = req.headers;
//     const settings = await ConfirmationProbationRating.findOne({
//       where: { orgId },
//       attributes: ["defaultExtendPeriod"]
//     });

//     const confirm = await EmployeeConfirmation.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     confirm.status = "extended";
//     await confirm.save();
//     const employee = await Employee.findOne({
//       attributes: [
//         "id",
//         "temporaryStatus",
//         "employmentDate",
//         "confirmationDueDate"
//       ],
//       where: { userId: confirm.confirmUserId },
//       transaction: t
//     });

//     employee.temporaryStatus = null;
//     await employee.save();

//     // Scehdule profile update
//     const employmentDate =
//       confirm.effectiveDate ||
//       confirm.confirmationDueDate ||
//       employee.employmentDate;

//     await scheduler.scheduleExtendEmployeeProbation({
//       dataValues: { ...confirm.dataValues, employmentDate },
//       authorization
//     });

//     // notification
//     let defaultExtend = "";
//     let configDueDate = employmentDate;
//     let extendDate = moment(employmentDate).add(confirm.extendBy, "M");

//     if (!confirm.effectiveDate && confirm.confirmationDueDate === null) {
//       defaultExtend = moment(employmentDate).add(
//         settings.defaultExtendPeriod,
//         "M"
//       );
//       extendDate = moment(defaultExtend).add(confirm.extendBy, "M");
//       configDueDate = defaultExtend;
//     }
//     extendDate = convertDateFormatMonthFirst(extendDate);
//     const dueDate = convertDateFormatMonthFirst(configDueDate);

//     const message = `We wish to inform you that your probation, which was due to end on ${dueDate}, has been extended till ${extendDate}.`;

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         message,
//         ...others,
//         start: dueDate,
//         end: extendDate,
//         type: "extension",
//         requestName: "Probation Extension",
//         actionSlug: "employeeProbationExtension"
//       }
//     });
//     return true;
//   } catch (err) {
//     return err;
//   }
// };

// exports.approveEmployeeDisengagement = async (data, req, t) => {
//   try {
//     const { authorization } = req.headers;
//     const { requestId, recipientId, orgId, ...others } = data;

//     await EmployeeConfirmation.update(
//       { status: "approved" },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     const confirm = await EmployeeConfirmation.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     // Scehdule profile update
//     await scheduler.scheduleEmployeeDisengagement({
//       dataValues: confirm,
//       authorization
//     });

//     const orgData = await globalAuth.AAA.getOrgDetails(confirm.orgId);

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Employee Disengagement",
//         actionSlug: "employeeDisengagement",
//         type: "disengage",
//         company: orgData.org.name,
//         start: confirm.effectiveDate,
//         emailOnly: true
//       }
//     });
//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// exports.approveEmployeeRedeployment = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;
//     const { authorization } = req.headers;

//     await Redeployment.update(
//       { status: "approved", approvalInitiated: true },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     const redeployment = await Redeployment.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     // Scehdule profile update
//     await scheduler.scheduleRedeployment({
//       dataValues: redeployment,
//       authorization
//     });

//     const location = await globalAuth.AAA.getLocationById(
//       redeployment.newOfficeId
//     );
//     const newLocation = location.name;

//     const designation = await globalAuth.AAA.getDesignation(
//       redeployment.newDesignationId
//     );
//     const newDesignation = designation.name;

//     const redeploymentDate = moment(redeployment.effectiveDate).format(
//       "DD/MM/YYYY"
//     );

//     const message = `You have been redeployed to the role of ${newDesignation} in the ${newLocation} location with effect from ${redeploymentDate}.`;

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         message,
//         ...others,
//         date: moment(),
//         app: "humanar",
//         type: "redeploy",
//         newDesignation,
//         newLocation,
//         categoryType: "Extension",
//         start: redeployment.effectiveDate,
//         senderId: req.headers.userid,
//         requestName: "Redeployment",
//         actionSlug: "employeeRedeployment"
//       }
//     });
//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// exports.approveEmployeeemployeeDelegation = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;
//     const { authorization } = req.headers;

//     await DelegationManagement.update(
//       { status: "active", approvalInitiated: true },
//       {
//         where: { id: requestId },
//         transaction: t
//       }
//     );

//     const delegate = await DelegationManagement.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     await Employee.update(
//       {
//         temporaryStatus: null
//       },
//       { where: { userId: delegate.delegatee } }
//     );

//     await scheduler.scheduleDelegationClose({ data: delegate });

//     // send notification
//     const delegator = await NotificationService.getEmpDetails(
//       delegate.delegator
//     );
//     const delegatee = await NotificationService.getEmpDetails(
//       delegate.delegatee
//     );

//     const start = convertDateFormatMonthFirst(delegate.delegationPeriodStart);
//     const end = convertDateFormatMonthFirst(delegate.delegationPeriodEnd);
//     const payload = {
//       orgId,
//       ...others,
//       type: "delegation",
//       reportTo: delegate.delegator, // report update to delegator
//       delegatee: delegate.delegatee,
//       delegatorName: delegator.name || "",
//       delegateeName: delegatee.name || "",
//       recipientId: delegate.delegatee,
//       isNotifyOthers: true,
//       delegation_type: "delegate_vacant",
//       end: delegate.delegationPeriodEnd,
//       start: delegate.delegationPeriodStart,
//       delegationReason: delegate.delegationReason,
//       actionSlug: "employeeDelegationManagement",
//       requestName: "Employee Delegation Management"
//     };

//     if (delegate.delegationReason === "vacant") {
//       const designation = await globalAuth.AAA.getDesignation(
//         delegate.delegator
//       );
//       const delegatorName = designation.name;

//       payload.delegatorName = delegatorName;
//       payload.isNotifyOthers = false;
//       payload.message = `We wish to inform you that you have been assigned to fill in the ${delegatorName} vacant position in the company starting from ${start} to ${end}.`;
//     } else if (delegate.delegationReason === "unavailable") {
//       payload.delegation_type = "delegate_unavailable";
//       payload.othersDesc = `We'd like to notify you that ${payload.delegateeName} has been appointed to temporarily fill your role from ${start} to ${end} while you're away from work.`;

//       payload.message = `We'd like to notify you that ${payload.delegatorName} will be away for a period, and you've been chosen to temporarily step into their role from ${start} to ${end}.`;
//     } else if (delegate.delegationReason === "support") {
//       payload.delegation_type = "delegate_support";
//       payload.othersDesc = `${payload.delegateeName} has been assigned to provide you with in-role support from ${start} to ${end}.`;

//       payload.message = `You have been assigned to provide support to ${payload.delegatorName} from ${start} to ${end}.`;
//     }

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload
//     });
//     return true;
//   } catch (err) {
//     return err;
//   }
// };

// // Approve Suspension Request
// exports.approveSuspensionRequest = async (data, req, t) => {
//   try {
//     const { authorization } = req.headers;
//     const { requestId, recipientId, orgId, ...others } = data;

//     const suspended = await SuspendEmployee.update(
//       { approvalStatus: "approved" },
//       { where: { id: requestId }, transaction: t }
//     );

//     const requestDetail = await SuspendEmployee.findByPk(requestId, {
//       transaction: t
//     });
//     const orgData = await globalAuth.AAA.getOrgDetails(requestDetail.orgId);

//     const { startDate, payrollStatus } = requestDetail;
//     const requestData = {
//       startDate,
//       payrollStatus,
//       userId: requestDetail.userId,
//       authorization: req.headers.authorization
//     };

//     // Schedule Profile update
//     await scheduler.scheduleSuspendEmployee(requestData);
//     if (requestDetail.endDate && requestDetail.endDate !== null) {
//       await scheduler.scheduleUnSuspendEmployee(requestDetail);
//     }

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Employee Suspension",
//         actionSlug: "employeeSuspension",
//         type: "suspend",
//         company: orgData.org.name,
//         start: requestDetail.startDate,
//         end: requestDetail.endDate,
//         indefinite: requestDetail.indefinite,
//         emailOnly: true
//       }
//     });
//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// // Approve UnSuspension Request
// exports.approveEmployeeUnSuspensionRequest = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;

//     await UnsuspendEmployee.update(
//       { approvalStatus: "approved" },
//       { where: { id: requestId }, transaction: t }
//     );

//     const unsuspendEmployee = await UnsuspendEmployee.findOne({
//       where: { id: requestId },
//       attributes: ["id", "orgId", "userId", "effectiveDate", "suspendId"],
//       transaction: t
//     });

//     await EmployeeActionService.unsuspendEmployeeService({
//       userId: unsuspendEmployee.userId,
//       authorization: req.headers.authorization,
//       suspendId:
//         unsuspendEmployee && unsuspendEmployee.suspendId
//           ? unsuspendEmployee.suspendId
//           : null
//     });

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Unsuspend Employee",
//         actionSlug: "unsuspendEmployee",
//         type: "unsuspend",
//         start: unsuspendEmployee.effectiveDate,
//         emailOnly: true
//       }
//     });
//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// // Approve re-engageEmployee Request
// exports.approveEmployeeReengageRequest = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;

//     await ReengageEmployee.update(
//       { approvalStatus: "approved", approvalInitiated: true },
//       { where: { id: requestId }, transaction: t }
//     );

//     const reengageEmployee = await ReengageEmployee.findOne({
//       where: { id: requestId },
//       attributes: ["id", "userId", "confirmDisengageId", "effectiveDate"],
//       transaction: t
//     });

//     await EmployeeActionService.reengageEmployeeService({
//       userId: reengageEmployee.userId,
//       confirmDisengageId: reengageEmployee.confirmDisengageId,
//       authorization: req.headers.authorization
//     });

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Re-engage Employee",
//         actionSlug: "re-engageEmployee",
//         type: "reengage",
//         start: reengageEmployee.effectiveDate,
//         emailOnly: true
//       }
//     });

//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// // Approve Revise Salary Request
// exports.approveSalaryRevisionRequest = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, orgId, ...others } = data;

//     const approveReviseSalary = await ReviseSalary.update(
//       { approvalStatus: "approved" },
//       { where: { id: requestId }, transaction: t }
//     );

//     const requestDetail = await ReviseSalary.findByPk(requestId, {
//       transaction: t
//     });

//     // schedule salary update
//     const reqData = {
//       effectiveDate: requestDetail.effectiveDate,
//       userId: requestDetail.userId,
//       reviseBy: requestDetail.reviseBy,
//       percentage: requestDetail.percentage,
//       amount: requestDetail.amount
//     };
//     await scheduler.scheduleReviseEmployeeSalary({ data: reqData });

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Revise Employee Salary",
//         actionSlug: "reviseEmployeeSalary"
//       }
//     });
//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// // Approve adjusted Employee Salary
// exports.approveAdjustEmployeeSalary = async (data, t) => {
//   const { requestId } = data;

//   await PayGradeService.updateDiscretionaryAdjustment(
//     {
//       id: requestId,
//       approvalStatus: "approved"
//     },
//     t
//   );

//   await EmployeeActionService.adjustEmployeeSalary({
//     requestId
//   });
// };

// // Approve Compensation Review
// exports.approveCompensationReviewAdjustment = async (data, req, t) => {
//   try {
//     const { requestId, recipientId, initiatorId } = data;

//     const requests = await ReviewRequest.findAll({ where: { requestId } });
//     await Promise.all(
//       requests.map(async review => {
//         if (review.adjustmentType === "promote") {
//           const update = {
//             requestId: review.adjustmentId,
//             req,
//             userId: recipientId
//           };
//           await InitiateApprovalAction.promoteEmployeeApprovalAction(update, t);
//         }
//         if (review.adjustmentType === "lump_sum_award") {
//           const update = {
//             requestId: review.adjustmentId,
//             reviseBy: initiatorId
//           };
//           await InitiateApprovalAction.awardLumpSumApprovalAction(update, t);
//           // Todo: Add to addition
//         }
//         if (review.adjustmentType === "discretionary_adjustment") {
//           const update = {
//             requestId: review.adjustmentId
//           };
//           await InitiateApprovalAction.discretionaryApprovementAction(
//             update,
//             t
//           );
//         }
//         const reviewUpdate = {
//           status: "approved"
//         };
//         await ReviewRequest.update(reviewUpdate, {
//           where: { id: review.id },
//           transaction: t
//         });
//       })
//     );
//     return true;
//   } catch (err) {
//     return err;
//   }
// };

// exports.approvePayGradeAdjustment = async (data, t) => {
//   try {
//     const { requestId } = data;

//     const requests = await PayGradeApproval.findOne({
//       where: { id: requestId },
//       transaction: t
//     });

//     const bulkPayGrade = await Promise.all(
//       requests.payGrades.map(async grade => {
//         const paygrade = await PayGradeService.findPayGrade({
//           id: grade
//         });
//         if (!paygrade) {
//           return null;
//         }

//         const payData = {
//           adjustBy: requests.adjustBy,
//           revisionParameter: requests.revisionParameter,
//           orgId: requests.orgId,
//           reviseBy: requests.reviseBy,
//           gradeId: grade,
//           reviseFactor: requests.reviseFactor,
//           initialValue: paygrade.rangeMidPoint,
//           initialRangeMidPoint: paygrade.rangeMidPoint,
//           initialRangeMinimum: paygrade.rangeMinimum,
//           initialRangeMaximum: paygrade.rangeMaximum
//         };
//         const paygradeData = await InitiateApprovalAction.adjustPaygradeData({
//           policy: requests.reviseFactor,
//           paygrade,
//           adjustBy: requests.adjustBy,
//           transaction: t
//         });
//         if (paygradeData.status === false) {
//           return null;
//         }
//         payData.currentRangeMidPoint = paygradeData.data.rangeMidPoint;
//         payData.currentRangeMinimum = paygradeData.data.rangeMinimum;
//         payData.currentRangeMaximum = paygradeData.data.rangeMaximum;
//         return payData;
//       })
//     );
//     await PayGradeService.createMultiplePayGradeReview(bulkPayGrade, t);

//     return true;
//   } catch (error) {
//     return error;
//   }
// };

// exports.approveLeaveBackRequest = async (data, t) => {
//   try {
//     const { requestId, initiatorId, recipientId, orgId, ...others } = data;

//     // Get LeaveBackRequest
//     const leaveBackRequest = await LeaveBackRequest.findOne({
//       where: {
//         id: requestId
//       },
//       transaction: t
//     });
//     const leaveRequests = await LeaveRequest.findAll({
//       where: {
//         id: leaveBackRequest.leaveRequestId
//       },
//       transaction: t
//     });
//     // Add approved days from leave balance
//     await InitiateApprovalAction.addApprovedDaysToBalance({
//       userId: leaveBackRequest.userId,
//       leaveRequests,
//       leaveBackRequest,
//       transaction: t
//     });

//     await LeaveBackRequest.update(
//       { approvalStatus: "approved", approvalBy: initiatorId },
//       { where: { id: requestId }, transaction: t }
//     );

//     await NotificationService.sendApprovalStatusNotification({
//       userId: recipientId,
//       payload: {
//         orgId,
//         ...others,
//         requestName: "Get Leave Day(s) Back",
//         actionSlug: "requestForGetLeaveDay(s)Back"
//       }
//     });
//     return true;
//   } catch (err) {
//     return err;
//   }
// };
