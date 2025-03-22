const reportModel = require("../../models/report.model");
const userModel = require("../../models/user.model");
const APIFeatures = require("../../utils/apiFeatures");

const GetAllUsersHandler = async (message = {}) => {
  try {
    // Đặt giá trị mặc định cho message.query nếu không tồn tại
    const query = message.query || {};

    // Tạo APIFeatures để lọc, sắp xếp và phân trang
    const features = new APIFeatures(
      userModel.find().select("name email role address phone lock"),
      query
    )
      .filter() // Áp dụng bộ lọc từ query
      .sort() // Sắp xếp theo query.sort hoặc mặc định
      .paginate(); // Phân trang theo query.page và query.limit

    // Lấy danh sách users
    const users = await features.query;

    // Đếm số lượng report cho từng user
    const userIds = users.map((user) => user._id);
    const reportCounts = await reportModel.aggregate([
      {
        $match: {
          userId: { $in: userIds } // Lọc report theo danh sách userIds
        }
      },
      {
        $group: {
          _id: "$userId", // Nhóm theo userId
          count: { $sum: 1 } // Đếm số lượng report cho mỗi user
        }
      }
    ]);

    // Chuyển reportCounts thành object để dễ tra cứu
    const reportCountMap = reportCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Thêm reportCount vào từng user
    const usersWithReportCount = users.map((user) => ({
      ...user._doc, // Hoặc user.toObject() nếu cần
      reportCount: reportCountMap[user._id.toString()] || 0 // Nếu không có report thì trả về 0
    }));

    // Đếm tổng số user sau khi áp dụng bộ lọc, nhưng trước phân trang
    const filterQuery = features.filterQuery || {};
    const totalUsers = await userModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalUsers / (features.limit || 10));

    return {
      users: usersWithReportCount,
      features,
      totalUsers,
      totalPages
    };
  } catch (error) {
    throw error;
  }
};

module.exports = GetAllUsersHandler;
