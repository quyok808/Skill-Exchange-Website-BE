var Mediator = require("mediator-js").Mediator,
  mediator = new Mediator();

const createAppointmentHandler = require("./handlers/createAppointment/createAppointmentHandler");

mediator.on("createAppointment", async (message) => {
  try {
    const result = await createAppointmentHandler(message);
    mediator.emit("createAppointmentResult", result);
  } catch (error) {
    mediator.emit("createAppointmentError", error);
  }
});

module.exports = mediator;
