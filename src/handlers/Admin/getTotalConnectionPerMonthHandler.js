const connectionsModel = require("../../models/connections.model");

const GetTotalConnectionPerMonthHandler = async (message) => {
  try {
    const connections = await connectionsModel.aggregate([
      {
        // Nhóm theo năm và tháng dựa trên trường createdAt (hoặc trường ngày của bạn)
        $group: {
          _id: {
            year: { $year: "$createdAt" }, // Trích xuất năm
            month: { $month: "$createdAt" } // Trích xuất tháng
          },
          total: { $sum: 1 } // Đếm số document trong mỗi nhóm
        }
      },
      {
        // Sắp xếp theo năm và tháng
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        // Định dạng output (tùy chọn)
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          total: 1
        }
      }
    ]);

    return connections; // Trả về mảng kết quả
  } catch (error) {
    throw error;
  }
};

module.exports = GetTotalConnectionPerMonthHandler;
