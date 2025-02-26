const catchAsync = require("../utils/catchAsync"); // Helper function to catch errors in async functions
const skillService = require("../services/skill.services");

exports.getAllSkill = catchAsync(async (req, res, next) => {
  const { skills, features, totalPages, totalUsers } =
    await skillService.getAllSkills(req.query);

  res.status(200).json({
    status: "success",
    results: skills.length,
    data: {
      skills,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalUsers,
    },
  });
});

exports.createSkill = catchAsync(async (req, res, next) => {
  const skill = await skillService.createSkill(req.body);

  res.status(201).json({
    status: "success",
    data: {
      skill,
    },
  });
});
