const userModel = require("../../models/user.model");
const AppError = require("../../utils/appError");
const appointmentModel = require("../../models/appointment.model");
const connectionsModel = require("../../models/connections.model");
const messageModel = require("../../models/message.model");
const reportModel = require("../../models/report.model");

const deleteUserHandler = async (message) => {
  try {
    const user = await userModel.findByIdAndDelete(message.userId);

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }

    await appointmentModel.deleteMany({
      $or: [{ senderId: message.userId }, { receiverId: message.userId }]
    });

    await connectionsModel.deleteMany({
      $or: [{ senderId: message.userId }, { receiverId: message.userId }]
    });

    await messageModel.deleteMany({
      sender: message.userId
    });

    await reportModel.deleteMany({
      $or: [{ userId: message.userId }, { reportedBy: message.userId }]
    });

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = deleteUserHandler;
