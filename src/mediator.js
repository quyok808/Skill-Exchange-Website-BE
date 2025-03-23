const catchAsync = require("./utils/catchAsync");
var Mediator = require("mediator-js").Mediator,
  mediator = new Mediator();

const createAppointmentHandler = require("./handlers/Appointments/createAppointment/createAppointmentHandler");
const deleteAppointmentHandler = require("./handlers/Appointments/deleteAppointment/deleteAppointmentHandler");
const getAppointmentHandler = require("./handlers/Appointments/getAppointment/getAppointmentHandler");
const getMyAppointments = require("./handlers/Appointments/getMyAppointments/getMyAppointmentsHandler");
const updateAppointmentStatus = require("./handlers/Appointments/updateAppointmentStatus/updateAppointmentStatusHandler");
const updateAppointment = require("./handlers/Appointments/updateAppointment/updateAppointmentHandler");
const GetAllUsersHandler = require("./handlers/Admin/getAllUsersHandler");
const deleteUserHandler = require("./handlers/Admin/deleteUserHandler");
const LockUserHandler = require("./handlers/Admin/lockUserHandler");
const ChangeRoleUserHandler = require("./handlers/Admin/changeRoleUserHandler");
const GetTotalConnectionPerMonthHandler = require("./handlers/Admin/getTotalConnectionPerMonthHandler");
const GetAllReportsHandler = require("./handlers/Reports/getAllReports.handler");
const createReportHandler = require("./handlers/Reports/createReport.handler");
const getReportByIdHandler = require("./handlers/Reports/getReportById.handler");
const DeleteReportHandler = require("./handlers/Reports/deleteReport.handler");
const ChangeReportStatusHandler = require("./handlers/Reports/changeReportStatus.handler");
const GetWarningByUserId = require("./handlers/Reports/getWarningByUserId.handler");

mediator.on(
  "createAppointment",
  catchAsync(async (message) => {
    try {
      const result = await createAppointmentHandler(message);
      mediator.emit("createAppointmentResult", result);
    } catch (error) {
      mediator.emit("createAppointmentError", error);
    }
  })
);

mediator.on(
  "deleteAppointment",
  catchAsync(async (message) => {
    try {
      const result = await deleteAppointmentHandler(message);
      mediator.emit("deleteAppointmentResult", result);
    } catch (error) {
      mediator.emit("deleteAppointmentError", error);
    }
  })
);

mediator.on("getAppointment", async (message) => {
  try {
    const result = await getAppointmentHandler(message);
    mediator.emit("getAppointmentResult", result);
  } catch (error) {
    mediator.emit("getAppointmentError", error);
  }
});

mediator.on("getMyAppointments", async (message) => {
  try {
    const result = await getMyAppointments(message);
    mediator.emit("getMyAppointmentsResult", result);
  } catch (error) {
    mediator.emit("getMyAppointmentsError", error);
  }
});

mediator.on("updateAppointmentStatus", async (message) => {
  try {
    const result = await updateAppointmentStatus(message);
    mediator.emit("updateAppointmentStatusResult", result);
  } catch (error) {
    mediator.emit("updateAppointmentStatusError", error);
  }
});

mediator.on("updateAppointment", async (message) => {
  try {
    const result = await updateAppointment(message);
    mediator.emit("updateAppointmentResult", result);
  } catch (error) {
    mediator.emit("updateAppointmentError", error);
  }
});

mediator.on("getAllUsers", async (message) => {
  try {
    const result = await GetAllUsersHandler(message);
    mediator.emit("getAllUsersResult", result);
  } catch (error) {
    mediator.emit("getAllUsersError", error);
  }
});

mediator.on("deleteUser", async (message) => {
  try {
    const result = await deleteUserHandler(message);
    mediator.emit("deleteUserResult", result);
  } catch (error) {
    mediator.emit("deleteUserError", error);
  }
});

mediator.on("lockUser", async (message) => {
  try {
    const result = await LockUserHandler(message);
    mediator.emit("lockUserResult", result);
  } catch (error) {
    mediator.emit("lockUserError", error);
  }
});

mediator.on("changeRole", async (message) => {
  try {
    const result = await ChangeRoleUserHandler(message);
    mediator.emit("changeRoleResult", result);
  } catch (error) {
    mediator.emit("changeRoleError", error);
  }
});

mediator.on("getConnectionReports", async (message) => {
  try {
    const result = await GetTotalConnectionPerMonthHandler(message);
    mediator.emit("getConnectionReportsResult", result);
  } catch (error) {
    mediator.emit("getConnectionReportsError", error);
  }
});

mediator.on("getAllReports", async (message) => {
  try {
    const result = await GetAllReportsHandler(message);
    mediator.emit("getAllReportsResult", result);
  } catch (error) {
    mediator.emit("getAllReportsError", error);
  }
});

mediator.on("getReportById", async (message) => {
  try {
    const result = await getReportByIdHandler(message);
    mediator.emit("getReportByIdResult", result);
  } catch (error) {
    mediator.emit("getReportByIdError", error);
  }
});

mediator.on("createReport", async (message) => {
  try {
    const result = await createReportHandler(message);
    mediator.emit("createReportResult", result);
  } catch (error) {
    mediator.emit("createReportError", error);
  }
});

mediator.on("deleteReport", async (message) => {
  try {
    const result = await DeleteReportHandler(message);
    mediator.emit("deleteReportResult", result);
  } catch (error) {
    mediator.emit("deleteReportError", error);
  }
});

mediator.on("changeReportStatus", async (message) => {
  try {
    const result = await ChangeReportStatusHandler(message);
    mediator.emit("changeReportStatusResult", result);
  } catch (error) {
    mediator.emit("changeReportStatusError", error);
  }
});

mediator.on("getWarningReportByUserId", async (message) => {
  try {
    const result = await GetWarningByUserId(message);
    mediator.emit("getWarningReportByUserIdResult", result);
  } catch (error) {
    mediator.emit("getWarningReportByUserIdError", error);
  }
});
module.exports = mediator;
