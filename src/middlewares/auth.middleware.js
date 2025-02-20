const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const BlacklistedToken = require("../models/blacklistedToken.model");

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Lấy token từ header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Kiểm tra xem token có nằm trong danh sách đen hay không
  const blacklistedToken = await BlacklistedToken.findOne({ token });
  if (blacklistedToken) {
    return next(new AppError("Invalid token! Please log in again.", 401));
  }

  // 3) Xác minh token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4) Kiểm tra xem user có còn tồn tại không
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // Gán user vào request
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
