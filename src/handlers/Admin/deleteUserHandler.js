const userModel = require("../../models/user.model");

const deleteUserHandler = async (message) => {
  try {
    const user = await userModel.findByIdAndDelete(message.userId);

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = deleteUserHandler;
