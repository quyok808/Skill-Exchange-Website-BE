const User = require("../models/user.model");
const Connection = require("../models/connections.model");
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
    expiresIn: process.env.JWT_EXPIRES_IN
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
    if (error.code === 11000) {
      // // Lỗi duplicate key
      // const duplicateField = Object.keys(error.keyValue)[0];
      throw new AppError("Email đã tồn tại. Vui lòng chọn giá trị khác.", 409);
    } else {
      throw error; // Chuyển lỗi khác cho controller
    }
  }
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

exports.login = async (loginInfo) => {
  try {
    const { email, password } = loginInfo;
    // 1) Kiểm tra xem email và password có tồn tại không
    if (!email || !password) {
      throw new AppError(
        "Thông tin email hoặc password chưa được điền đầy đủ!",
        400
      );
    }

    if (!isValidEmail(email)) {
      throw new AppError("Định dạng email phải là example@gmail.com", 401);
    }

    // 2) Kiểm tra xem user có tồn tại và password có đúng không
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password, user.password))) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    if (!user.active) {
      // Kiểm tra trạng thái active
      throw new AppError("Vui lòng xác nhận email trước khi đăng nhập.", 403);
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

exports.searchUser = async (query, currentUserId) => {
  try {
    let findConditions = {};

    // Nếu có skillName, tìm các skill khớp trước
    if (query.skillName) {
      const skillIds = await Skill.find({
        name: { $regex: query.skillName, $options: "i" }
      }).distinct("_id"); // Lấy danh sách ObjectId của skills khớp
      if (skillIds.length == 0) {
        throw new AppError("Không có thông tin kỹ năng", 404);
      }
      if (skillIds.length > 0) {
        findConditions.skills = { $in: skillIds }; // Lọc user có skills trong danh sách
      } else {
        return { users: [], features: null, totalUsers: 0, totalPages: 0 }; // Không tìm thấy skill nào khớp
      }
    }

    // Loại trừ user đang đăng nhập
    if (currentUserId) {
      findConditions._id = { $ne: currentUserId }; // Thêm điều kiện để loại trừ user hiện tại
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

// Hàm tìm kiếm các userId liên quan đến currentUserId
exports.getRelatedUserIds = async (currentUserId) => {
  try {
    // Tìm tất cả các connections mà currentUserId là sender hoặc receiver
    const connections = await Connection.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    }).select("senderId receiverId"); // Chỉ lấy các trường senderId và receiverId

    // Tạo mảng để lưu các userId liên quan
    const relatedUserIds = [];

    // Duyệt qua các connections và lấy userId còn lại
    connections.forEach((connection) => {
      // Nếu currentUserId là sender, thêm receiverId
      if (connection.senderId.toString() === currentUserId.toString()) {
        relatedUserIds.push(connection.receiverId);
      }
      // Nếu currentUserId là receiver, thêm senderId
      else if (connection.receiverId.toString() === currentUserId.toString()) {
        relatedUserIds.push(connection.senderId);
      }
    });

    // Loại bỏ các giá trị trùng lặp (nếu có) và trả về
    return [...new Set(relatedUserIds.map((id) => id.toString()))];
  } catch (error) {
    throw error;
  }
};

exports.searchUserInNetwork = async (query, currentUserId) => {
  try {
    let findConditions = {};

    // Nếu có skillName, tìm các skill khớp trước
    if (query.skillName) {
      const skillIds = await Skill.find({
        name: { $regex: query.skillName, $options: "i" }
      }).distinct("_id"); // Lấy danh sách ObjectId của skills khớp
      if (skillIds.length === 0) {
        return { users: [], features: null, totalUsers: 0, totalPages: 0 }; // Không tìm thấy skill nào khớp
      }
      findConditions.skills = { $in: skillIds }; // Lọc user có skills trong danh sách
    }

    // Lấy danh sách các users đã kết nối
    const sentConnections = await Connection.find({
      senderId: currentUserId,
      status: "accepted"
    }).distinct("receiverId");

    const receivedConnections = await Connection.find({
      receiverId: currentUserId,
      status: "accepted"
    }).distinct("senderId");

    // Kết hợp hai mảng và loại bỏ trùng lặp
    const connectedUserIds = [
      ...new Set([...sentConnections, ...receivedConnections])
    ];
    //Kiểm tra lại user id
    const validConnections = connectedUserIds.filter(
      (id) => id.toString() !== currentUserId
    );

    // Lọc userIds trong list
    findConditions._id = { $in: validConnections };

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
      runValidators: true // Chạy các validators trong schema
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
        runValidators: true
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
        message
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
    emailVerificationExpires: { $gt: Date.now() }
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
    const resetURL = `${protocol}://${host}/reset-password/${resetToken}`;

    const message = `Bạn quên mật khẩu rồi sao? Vui lòng click vào link bên dưới để tạo mật khẩu mới: ${resetURL}.\nNếu như không phải do bạn yêu cầu, vui lòng bỏ qua email này!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message: message
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
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) Nếu token chưa hết hạn và có user, đặt lại password
    if (!user) {
      throw new AppError(
        "Link đã hết hạn, vui lòng gửi lại yêu cầu khác!",
        400
      );
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
      runValidators: true // Chạy các validators trong schema
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
      throw new AppError("Mật khẩu hiện tại sai, vui lòng nhập lại", 401);
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
    const skillList = skillData.skills;
    if (!Array.isArray(skillList)) {
      throw new AppError("skillData.skills must be an array", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 1) Xử lý danh sách kỹ năng gửi lên
    const skillIds = [];
    for (const skillItem of skillList) {
      let skillName;
      // Nếu là object, chỉ lấy name; nếu là string, dùng trực tiếp
      if (typeof skillItem === "object" && skillItem.name) {
        skillName = skillItem.name;
      } else if (typeof skillItem === "string") {
        skillName = skillItem;
      } else {
        continue;
      }

      // Kiểm tra xem skillName có phải là _id không
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(skillName);
      if (isObjectId) {
        continue;
      }

      // Tìm hoặc tạo skill
      let skill = await Skill.findOne({
        name: { $regex: new RegExp(skillName, "i") }
      });
      if (!skill) {
        skill = await Skill.create({ name: skillName });
      }
      skillIds.push(skill._id); // Thêm _id vào danh sách mới
    }

    // 2) So sánh với danh sách hiện tại và cập nhật
    user.skills = skillIds; // Thay thế hoàn toàn danh sách cũ bằng danh sách mới
    await user.save();

    // 4) Trả về user đã cập nhật với skills được populate
    const updatedUser = await User.findById(userId)
      .populate("skills")
      .select(["+_id", "+name", "+email"]);
    return updatedUser;
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
