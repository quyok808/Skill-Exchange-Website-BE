const Idea = require("../models/idea.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createIdea = catchAsync(async (req, res, next) => {
  const { caption, description } = req.body;

  const newIdea = await Idea.create({
    caption,
    description,
    createdBy: req.user.id,
  });

  res.status(201).json({
    status: "success",
    data: {
      idea: newIdea,
    },
  });
});

exports.getIdea = catchAsync(async (req, res, next) => {
  const idea = await Idea.findById(req.params.id).populate({
    path: "createdBy",
    select: "name email",
  });

  if (!idea) {
    return next(new AppError("No Idea found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      idea,
    },
  });
});

exports.getAllIdeas = catchAsync(async (req, res, next) => {
  const ideas = await Idea.find();

  res.status(200).json({
    status: "Success",
    results: ideas.length,
    data: {
      ideas,
    },
  });
});
