const Skill = require("../models/skill.model");
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
