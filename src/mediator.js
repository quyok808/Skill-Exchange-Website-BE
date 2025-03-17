var Mediator = require("mediator-js").Mediator,
  mediator = new Mediator();

const createAppointmentHandler = require("./handlers/createAppointment/createAppointmentHandler");
const deleteAppointmentHandler = require("./handlers/deleteAppointment/deleteAppointmentHandler");
const catchAsync = require("./utils/catchAsync");

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

module.exports = mediator;
