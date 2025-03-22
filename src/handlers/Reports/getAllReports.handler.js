const reportModel = require("../../models/report.model");

const GetAllReportsHandler = async (message) => {
  try {
    const reports = await reportModel
      .find()
      .populate("userId reportedBy", "name email");
    return reports;
  } catch (error) {
    throw error;
  }
};

module.exports = GetAllReportsHandler;
