const reportModel = require("../../models/report.model");
const AppError = require("../../utils/appError");

const createReportHandler = async (message) => {
  try {
    //1
    // if (!message.reason) {
    //   //2
    //   throw new AppError("Vui lòng nhập lý do báo cáo!", 400); //3
    // }
    if (!message.reason || message.reason.trim() === "") {
      throw new AppError("Vui lòng nhập lý do báo cáo!", 400);
    }

    if (message.userId === message.reportedBy) {
      //4
      throw new AppError("Không thể tự báo cáo chính mình", 400); //5
    }

    const newReports = await reportModel.create({
      userId: message.userId,
      reportedBy: message.reportedBy,
      reason: message.reason
    }); //6

    return newReports; //7
  } catch (error) {
    //8
    throw error; //9
  }
};

module.exports = createReportHandler;
