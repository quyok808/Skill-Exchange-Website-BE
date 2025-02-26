const Skill = require("../models/skill.model");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllSkills = async (query) => {
  try {
    const features = new APIFeatures(Skill.find(), query)
      .filter()
      .sort()
      .paginate();

    const skills = await features.query;

    // const totalUsers = await User.countDocuments();
    const totalUsers = await Skill.countDocuments(features.mongoQuery); // Đếm số lượng user sau khi filter
    const totalPages = Math.ceil(totalUsers / features.limit);
    return { skills, features, totalUsers, totalPages };
  } catch (error) {
    throw error;
  }
};

exports.createSkill = async (skillData) => {
  try {
    const skill = await Skill.create(skillData);
    return skill;
  } catch (error) {
    throw error;
  }
};

exports.delete = async (id) => {
  try {
    const skill = await Skill.findByIdAndDelete(id);

    if (!skill) {
      throw new AppError("No skill found with that ID", 404);
    }

    await User.updateMany({ skills: id }, { $pull: { skills: id } });
  } catch (error) {
    throw error;
  }
};

exports.update = async (id, skillData) => {
  try {
    const skill = await Skill.findByIdAndUpdate(id, skillData, {
      new: true, // Trả về user đã được cập nhật
      runValidators: true, // Chạy các validators trong schema
    });

    if (!skill) {
      throw new AppError("No skill found with that ID", 404);
    }
    return skill;
  } catch (error) {
    throw error;
  }
};
