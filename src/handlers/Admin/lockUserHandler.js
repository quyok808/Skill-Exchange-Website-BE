const userModel = require("../../models/user.model");
const AppError = require("../../utils/appError");

const LockUserHandler = async (message) => {
  try {
    const user = await userModel
      .findByIdAndUpdate(
        message.userId,
        { lock: message.lock },
        {
          new: true,
          runValidators: true
        }
      )
      .select("-password");

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = LockUserHandler;
