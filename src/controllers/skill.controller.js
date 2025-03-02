const catchAsync = require("../utils/catchAsync"); // Helper function to catch errors in async functions
const skillService = require("../services/skill.services");

exports.getAllSkill = catchAsync(async (req, res, next) => {
  const { skills, features, totalPages, totalSkills } =
    await skillService.getAllSkills(req.query);

  res.status(200).json({
    status: "success",
    results: skills.length,
    data: {
      skills,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalSkills,
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

exports.deleteSkill = catchAsync(async (req, res, next) => {
  await skillService.delete(req.params.id);
  res.status(204).json({ status: "success", data: null }); // 204 No Content
});

exports.updateSkill = catchAsync(async (req, res, next) => {
  const skill = await skillService.update(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { skill } });
});
