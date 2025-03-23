const reportModel = require("../../models/report.model");
const AppError = require("../../utils/appError");

const createReportHandler = async (message) => {
  try {
    if (!message.reason) {
      throw new AppError("Vui lòng nhập lý do báo cáo!", 400);
    }

    if (message.userId === message.reportedBy) {
      throw new AppError("Không thể tự báo cáo chính mình", 400);
    }

    const newReports = await reportModel.create({
      userId: message.userId,
      reportedBy: message.reportedBy,
      reason: message.reason
    });

    return newReports;
  } catch (error) {
    throw error;
  }
};

module.exports = createReportHandler;
