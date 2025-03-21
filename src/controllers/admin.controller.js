const mediator = require("../mediator");
const catchAsync = require("../utils/catchAsync");
const getDataFromMediator = require("../utils/promise_Mediator");

// Lấy tất cả users (ví dụ, chỉ admin mới có quyền)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  mediator.emit("getAllUsers", { query: "" });

  const { users, features, totalPages, totalUsers } = await getDataFromMediator(
    "getAllUsersResult",
    "getAllUsersError",
    mediator
  );

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalUsers
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  mediator.emit("deleteUser", { userId: req.params.id });

  const hasDelete = await getDataFromMediator(
    "deleteUserResult",
    "deleteUserError",
    mediator
  );

  res.status(204).json({ status: "success", data: null });
});
