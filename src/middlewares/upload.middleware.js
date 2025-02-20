const multer = require("multer");
const AppError = require("../utils/appError");

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/avatar/"); // Thư mục lưu trữ hình ảnh
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1]; // Lấy extension của file
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // Tạo tên file duy nhất
  },
});

// Lọc file (chỉ cho phép hình ảnh)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Giới hạn kích thước file (5MB)
  },
});

exports.uploadUserPhoto = upload.single("photo"); // 'photo' là tên field trong form data
