const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError"); // Custom error class
const crypto = require("crypto");
const sendEmail = require("../configs/email");
const BlacklistedToken = require("../models/blacklistedToken.model");
const APIFeatures = require("../utils/apiFeatures");
const Skill = require("../models/skill.model");
const path = require("path");

// Hàm tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (userData) => {
  try {
    // Tạo user mới
    const newUser = await User.create(userData);

    // Tạo token
    const token = signToken(newUser._id);

    return { user: newUser, token }; // Trả về cả user và token
  } catch (error) {
    throw error; // Chuyển lỗi cho controller
  }
};

exports.login = async (loginInfo) => {
  try {
    const { email, password } = loginInfo;
    // 1) Kiểm tra xem email và password có tồn tại không
    if (!email || !password) {
      throw new AppError("Please provide email and password!", 400);
    }
    // 2) Kiểm tra xem user có tồn tại và password có đúng không
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password, user.password))) {
      throw new AppError("Incorrect email or password", 401);
    }

    if (!user.active) {
      // Kiểm tra trạng thái active
      throw new AppError("Please verify your email before logging in.", 403);
    }

    // 3) Nếu mọi thứ OK, gửi token đến client
    const token = signToken(user._id);

    return token;
  } catch (error) {
    throw error;
  }
};

exports.getAllUsers = async (query) => {
  try {
    const features = new APIFeatures(User.find().populate("skills"), query)
      .filter()
      .sort()
      .paginate();

    const users = await features.query;

    // const totalUsers = await User.countDocuments();
    const totalUsers = await User.countDocuments(features.mongoQuery); // Đếm số lượng user sau khi filter
    const totalPages = Math.ceil(totalUsers / features.limit);
    return { users, features, totalUsers, totalPages };
  } catch (error) {
    throw error;
  }
};

exports.searchUser = async (query) => {
  try {
    let findConditions = {};

    // Nếu có skillName, tìm các skill khớp trước
    if (query.skillName) {
      const skillIds = await Skill.find({
        name: { $regex: query.skillName, $options: "i" },
      }).distinct("_id"); // Lấy danh sách ObjectId của skills khớp

      if (skillIds.length > 0) {
        findConditions.skills = { $in: skillIds }; // Lọc user có skills trong danh sách
      } else {
        return { users: [], features: null, totalUsers: 0, totalPages: 0 }; // Không tìm thấy skill nào khớp
      }
    }

    const features = new APIFeatures(
      User.find(findConditions)
        .populate("skills")
        .select(["-password", "-role", "-active"]),
      query
    )
      .filter()
      .sort()
      .paginate();
    const users = await features.query;

    const totalUsers = await User.countDocuments(features.mongoQuery);
    const totalPages = Math.ceil(totalUsers / features.limit);

    return { users, features, totalUsers, totalPages };
  } catch (error) {
    throw error;
  }
};

exports.get = async (id) => {
  try {
    const user = await User.findById(id).populate("skills");

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

exports.put = async (id, updateUserData) => {
  try {
    const user = await User.findByIdAndUpdate(id, updateUserData, {
      new: true, // Trả về user đã được cập nhật
      runValidators: true, // Chạy các validators trong schema
    });

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
  } catch (error) {
    throw error;
  }
};

exports.delete = async (id) => {
  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

exports.uploadAvatar = async (id, filename) => {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { photo: filename },
      {
        new: true,
        runValidators: true,
      }
    ).populate("skills");
    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }
    return user;
  } catch (error) {
    throw error;
  }
};

const createVerificationToken = async (user) => {
  if (user.active) {
    throw new AppError("This email has already been verified", 400);
  }

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  return verificationToken;
};

exports.sendVerificationEmail = async (userId, protocol, host) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const verificationToken = await createVerificationToken(user);
    const verificationURL = `${protocol}://${host}/api/users/verify-email/${verificationToken}`;

    const message = `Please verify your email by clicking on this link:\n\n${verificationURL}\n\nThis link is valid for 24 hours.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your email verification token (valid for 24 hours)",
        message,
      });
    } catch (error) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new AppError(
        "There was an error sending the email. Try again later!",
        500
      );
    }
  } catch (error) {
    throw error;
  }
};

exports.verifyEmail = async (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  if (user.active) {
    throw new AppError("This email has already been verified", 400);
  }

  user.active = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

exports.forgotPassword = async (email, protocol, host) => {
  try {
    // 1) Lấy user dựa trên email
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new AppError("There is no user with email address.", 404);
    }

    // 2) Tạo reset token ngẫu nhiên
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Gửi nó đến email của user
    const resetURL = `${protocol}://${host}/api/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message: message,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError(
        "There was an error sending the email. Try again later!",
        500
      );
    }
  } catch (error) {
    throw error;
  }
};

exports.resetPassword = async (token, password) => {
  try {
    // 1) Lấy user dựa trên token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) Nếu token chưa hết hạn và có user, đặt lại password
    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // Lúc này middleware `pre('save')` sẽ băm mật khẩu
    const newToken = signToken(user._id);
    return { token: newToken };
  } catch (error) {
    throw error;
  }
};

exports.logout = async (token) => {
  try {
    // Thêm token vào danh sách đen
    await BlacklistedToken.create({ token });
  } catch (error) {
    throw error;
  }
};

exports.me = async (id) => {
  try {
    // Bước 2: Thực hiện populate
    const user = await User.findById(id).populate("skills").select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

exports.updateMe = async (id, updateUserData) => {
  try {
    const user = await User.findByIdAndUpdate(id, updateUserData, {
      new: true, // Trả về user đã được cập nhật
      runValidators: true, // Chạy các validators trong schema
    }).populate("skills");

    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }
    return user;
  } catch (error) {
    throw error;
  }
};

exports.changePassword = async (id, pass, currentToken) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(id).select("+password");

    // 2) Check if posted current password is correct
    if (!(await user.comparePassword(pass.passwordCurrent, user.password))) {
      throw new AppError("Wrong password", 401);
    }

    // 3) If so, update password
    user.password = pass.password;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();

    this.logout(currentToken);
  } catch (error) {
    throw error;
  }
};

exports.addSkillToUser = async (userId, skillData) => {
  try {
    // 1) Tìm skill trong database
    let skill = await Skill.findOne(skillData);

    // 2) Nếu skill không tồn tại, tạo skill mới
    if (!skill) {
      skill = await Skill.create(skillData);
    }

    // 3) Tìm user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 4) Kiểm tra xem skill đã có trong user chưa
    if (user.skills.includes(skill._id)) {
      throw new AppError("Skill already exists for this user", 400);
    }

    // 5) Thêm skill vào user
    user.skills.push(skill._id);
    await user.save();
    return user.populate("skills");
  } catch (error) {
    throw error;
  }
};

exports.getImagePath = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const imagePath = user.photo;

    if (!imagePath) {
      throw new AppError("Image not found", 404);
    }

    const absolutePath = path.join(__dirname, "../uploads/avatars", imagePath);
    return absolutePath;
  } catch (error) {
    throw error;
  }
};
