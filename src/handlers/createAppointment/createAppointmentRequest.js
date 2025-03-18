class CreateAppointmentRequest {
  constructor(senderId, receiverId, startTime, endTime, description) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.description = description;
  }
}

module.exports = CreateAppointmentRequest;
