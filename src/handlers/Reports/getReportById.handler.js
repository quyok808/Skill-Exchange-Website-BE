const reportModel = require("../../models/report.model");
const AppError = require("../../utils/appError");

const getReportByIdHandler = async (message) => {
  try {
    const report = await reportModel
      .findById(message.reportedId)
      .populate("userId reportedBy", "username email");
    if (!report) throw new AppError("Không tìm thấy báo cáo!");
    return report;
  } catch (error) {
    throw error;
  }
};

module.exports = getReportByIdHandler;
