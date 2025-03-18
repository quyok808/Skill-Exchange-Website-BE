const catchAsync = require("./utils/catchAsync");
var Mediator = require("mediator-js").Mediator,
  mediator = new Mediator();

const createAppointmentHandler = require("./handlers/createAppointment/createAppointmentHandler");
const deleteAppointmentHandler = require("./handlers/deleteAppointment/deleteAppointmentHandler");
const getAppointmentHandler = require("./handlers/getAppointment/getAppointmentHandler");
const getMyAppointments = require("./handlers/getMyAppointments/getMyAppointmentsHandler");
const updateAppointmentStatus = require("./handlers/updateAppointmentStatus/updateAppointmentStatusHandler");

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

module.exports = mediator;
