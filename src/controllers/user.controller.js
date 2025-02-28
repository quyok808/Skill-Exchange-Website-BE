const catchAsync = require("../utils/catchAsync"); // Helper function to catch errors in async functions
const userService = require("../services/user.services");

// Đăng ký người dùng mới
exports.register = catchAsync(async (req, res, next) => {
  try {
    const { user, token } = await userService.register(req.body);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Đăng nhập
exports.login = catchAsync(async (req, res, next) => {
  const token = await userService.login(req.body);

  res.status(200).json({
    status: "success",
    token,
  });
});

// Lấy tất cả users (ví dụ, chỉ admin mới có quyền)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { users, features, totalPages, totalUsers } =
    await userService.getAllUsers(req.query);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalUsers,
    },
  });
});

// Lấy tất cả users (dành cho user - search user)
exports.searchUser = catchAsync(async (req, res, next) => {
  const { users, features, totalPages, totalUsers } =
    await userService.searchUser(req.query);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalUsers,
    },
  });
});

// Lấy thông tin 1 user
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.get(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Cập nhật thông tin user
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.put(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Xóa user
exports.deleteUser = catchAsync(async (req, res, next) => {
  await userService.delete(req.params.id);

  res.status(204).json({ status: "success", data: null }); // 204 No Content
});

// Upload photo
exports.uploadUserPhoto = catchAsync(async (req, res, next) => {
  const user = await userService.uploadAvatar(req.user.id, req.file.filename);
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Gửi email xác thực
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  await userService.sendVerificationEmail(
    req.user.id,
    req.protocol,
    req.get("host")
  );

  res.status(200).json({
    status: "success",
    message: "Verification email sent to your email address.",
  });
});

//Xác thực email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  await userService.verifyEmail(req.params.token);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully!",
  });
});

// Quên mật khẩu
exports.forgotPassword = catchAsync(async (req, res, next) => {
  await userService.forgotPassword(
    req.body.email,
    req.protocol,
    req.get("host")
  );
  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

//Get profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await userService.me(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

//Update profile
exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await userService.updateMe(req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Reset mật khẩu
exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = await userService.resetPassword(
    req.params.token,
    req.body.password
  );
  // 4) Log user in, gửi JWT

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  await userService.logout(req.headers.authorization.split(" ")[1]);

  res.status(200).json({
    status: "success",
    message: "Logged out successfully!",
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  await userService.changePassword(
    req.user.id,
    req.body,
    req.headers.authorization.split(" ")[1]
  );

  res.status(200).json({
    status: "success",
    message: "Password has been changed!",
  });
});

exports.addSkillToUser = catchAsync(async (req, res, next) => {
  const user = await userService.addSkillToUser(req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
