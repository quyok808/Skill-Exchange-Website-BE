const userModel = require("../../models/user.model");
const APIFeatures = require("../../utils/apiFeatures");

const GetAllUsersHandler = async (message = {}) => {
  try {
    // Đặt giá trị mặc định cho message.query nếu không tồn tại
    const query = message.query || {};

    const features = new APIFeatures(
      userModel.find().select("name email role address phone"),
      query
    )
      .filter() // Áp dụng bộ lọc từ query
      .sort() // Sắp xếp theo query.sort hoặc mặc định
      .paginate(); // Phân trang theo query.page và query.limit

    const users = await features.query;
    // Đếm số lượng user sau khi áp dụng bộ lọc, nhưng trước phân trang
    const filterQuery = features.filterQuery || {}; // Giả định APIFeatures lưu filterQuery
    const totalUsers = await userModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalUsers / (features.limit || 10)); // Mặc định limit là 10 nếu undefined
    return { users, features, totalUsers, totalPages };
  } catch (error) {
    throw error;
  }
};

module.exports = GetAllUsersHandler;
