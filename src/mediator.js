const Mediator = require("mediator-js");

const createAppointmentHandler = require("./handlers/createAppointment/createAppointmentHandler");

const mediator = new Mediator();

mediator.on("createAppointment", async (message) => {
  try {
    const result = await createAppointmentHandler(message);
    mediator.emit("createAppointmentResult", result);
  } catch (error) {
    mediator.emit("createAppointmentError", error);
  }
});

module.exports = mediator;
