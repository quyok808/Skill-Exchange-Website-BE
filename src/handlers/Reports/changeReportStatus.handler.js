const reportModel = require("../../models/report.model");
const AppError = require("../../utils/appError");

const ChangeReportStatusHandler = async (message) => {
  try {
    const report = await reportModel.findByIdAndUpdate(
      message.reportId,
      { status: message.status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!report) {
      throw new AppError("No report found with that ID", 404);
    }
    return report;
  } catch (error) {
    throw error;
  }
};

module.exports = ChangeReportStatusHandler;
