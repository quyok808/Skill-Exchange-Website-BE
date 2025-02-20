const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync"); // Helper function to catch errors in async functions
const AppError = require("../utils/appError"); // Custom error class
const sendEmail = require("../configs/email");
const crypto = require("crypto");
const BlacklistedToken = require("../models/blacklistedToken.model");

// Hàm tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Đăng ký người dùng mới
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

// Đăng nhập
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Kiểm tra xem email và password có tồn tại không
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Kiểm tra xem user có tồn tại và password có đúng không
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.active) {
    // Kiểm tra trạng thái active
    return next(
      new AppError("Please verify your email before logging in.", 403)
    );
  }

  // 3) Nếu mọi thứ OK, gửi token đến client
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});

// Lấy tất cả users (ví dụ, chỉ admin mới có quyền)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

// Lấy thông tin 1 user
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Cập nhật thông tin user
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Trả về user đã được cập nhật
    runValidators: true, // Chạy các validators trong schema
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Xóa user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({ status: "success", data: null }); // 204 No Content
});

// Upload photo
exports.uploadUserPhoto = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { photo: req.file.filename },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Gửi email xác thực
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id); // Giả sử người dùng đã đăng ký và được lưu vào req.user
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationURL = `${req.protocol}://${req.get(
    "host"
  )}/api/users/verify-email/${verificationToken}`; // Tạo URL xác thực

  const message = `Please verify your email by clicking on this link:\n\n${verificationURL}\n\nThis link is valid for 24 hours.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your email verification token (valid for 24 hours)",
      message: message,
    });

    res.status(200).json({
      status: "success",
      message: "Verification email sent to your email address.",
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

//Xác thực email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    if (user.active) {
      return next(new AppError("This email has already been verified", 400)); // Hoặc một thông báo phù hợp
    }

    user.active = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully!",
    });
  } catch (error) {
    return next(error); // Chuyển lỗi cho middleware xử lý lỗi
  }
});

// Quên mật khẩu
exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log("forgotPassword được gọi!");
  console.log("req.body.email:", req.body.email);

  // 1) Lấy user dựa trên email
  const user = await User.findOne({ email: req.body.email });
  console.log("User tìm thấy:", user);

  if (!user) {
    console.log("Không tìm thấy user với email này!");
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Tạo reset token ngẫu nhiên
  const resetToken = user.createPasswordResetToken();
  console.log("resetToken:", resetToken);
  await user.save({ validateBeforeSave: false });

  // 3) Gửi nó đến email của user
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/users/reset-password/${resetToken}`;
  console.log("resetURL:", resetURL);

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    console.log("Đang cố gắng gửi email...");
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message: message,
    });
    console.log("Email đã được gửi!");

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    console.error("Lỗi khi gửi email:", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

//Get profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password"); // Loại bỏ trường password; // Lấy user từ req.user.id

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Reset mật khẩu
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Lấy user dựa trên token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Nếu token chưa hết hạn và có user, đặt lại password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // Lúc này middleware `pre('save')` sẽ băm mật khẩu

  // 3) Cập nhật changedPasswordAt property cho user
  // 4) Log user in, gửi JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1]; // Lấy token từ header

  // Thêm token vào danh sách đen
  await BlacklistedToken.create({ token });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully!",
  });
});
