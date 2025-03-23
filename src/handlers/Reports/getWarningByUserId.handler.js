const reportModel = require("../../models/report.model");

const GetWarningByUserId = async (message) => {
  try {
    const reports = await reportModel.find({
      userId: message.userId,
      status: "Warning"
    });

    return { totalReports: reports.length, reports };
  } catch (error) {
    throw error;
  }
};

module.exports = GetWarningByUserId;
