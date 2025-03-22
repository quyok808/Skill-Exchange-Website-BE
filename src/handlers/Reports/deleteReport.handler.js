const reportModel = require("../../models/report.model");
const AppError = require("../../utils/appError");

const DeleteReportHandler = async (message) => {
  try {
    const report = await reportModel.findByIdAndDelete(message.reportId);

    if (!report) {
      throw new AppError("No report found with that ID", 404);
    }
    return report;
  } catch (error) {
    throw error;
  }
};

module.exports = DeleteReportHandler;
