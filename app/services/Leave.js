const Employee = require("../../models/Employee");

// Get leave days and exclude off days
exports.employeeLeaveDays = async ({ startDate, endDate, userId }) => {
  // Get the employee's pay type
  const employee = await Employee.findOne({
    where: { userId },
    attribute: ["orgId", "paytype", "payFrequency"]
  });

//   const paySchedule = await PaySchedule.findOne({
//     where: {
//       orgId: employee.orgId,
//       payType: employee.payType,
//       payFrequency: employee.payFrequency
//     },
//     attributes: ["weeklyWorkingDays"]
//   });

//   if (!paySchedule) {
//     throw new Error("Employee's pay schedule has not been setup");
//   }
  // get off days
  const offDays = paySchedule.weeklyWorkingDays
    .filter(off => off.state === false)
    .map(day => day.caption);

  const dayNames = this.getDates(startDate, endDate);

  // Get leave days requested
  const daysRequested = this.calculateLeaveDays(offDays, dayNames);

  return daysRequested;
};