const mediator = require("../mediator");
const catchAsync = require("../utils/catchAsync");
const getDataFromMediator = require("../utils/promise_Mediator");

exports.getAllReports = catchAsync(async (req, res, next) => {
  mediator.emit("getAllReports");

  const reports = await getDataFromMediator(
    "getAllReportsResult",
    "getAllReportsError",
    mediator
  );

  res.status(200).json({
    status: "success",
    data: {
      reports
    }
  });
});

exports.getReportById = catchAsync(async (req, res, next) => {
  mediator.emit("getReportById", { reportedId: req.params.id });
  console.log("params: ", req.params.id);
  const report = await getDataFromMediator(
    "getReportByIdResult",
    "getReportByIdError",
    mediator
  );

  res.status(200).json({
    status: "success",
    data: {
      report
    }
  });
});

exports.createReport = catchAsync(async (req, res, next) => {
  mediator.emit("createReport", {
    userId: req.body.userId,
    reportedBy: req.user.id,
    reason: req.body.reason
  });

  const report = await getDataFromMediator(
    "createReportResult",
    "createReportError",
    mediator
  );

  res.status(201).json({
    status: "success",
    data: {
      report
    }
  });
});

exports.deleteReport = catchAsync(async (req, res, next) => {
  mediator.emit("deleteReport", { reportId: req.params.id });

  const report = await getDataFromMediator(
    "deleteReportResult",
    "deleteReportError",
    mediator
  );

  res.status(204).json({ status: "success", data: null });
});

exports.changeStatus = catchAsync(async (req, res, next) => {
  mediator.emit("changeReportStatus", {
    reportId: req.params.id,
    status: req.body.status
  });

  const report = await getDataFromMediator(
    "changeReportStatusResult",
    "changeReportStatusError",
    mediator
  );

  res.status(201).json({
    status: "success",
    data: {
      report
    }
  });
});

exports.getWarning = catchAsync(async (req, res, next) => {
  mediator.emit("getWarningReportByUserId", {
    userId: req.user.id
  });

  const { totalReports, reports } = await getDataFromMediator(
    "getWarningReportByUserIdResult",
    "getWarningReportByUserIdError",
    mediator
  );

  res.status(201).json({
    status: "success",
    data: {
      totalReports,
      reports
    }
  });
});
