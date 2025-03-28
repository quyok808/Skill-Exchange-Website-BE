const multer = require("multer");
const AppError = require("../utils/appError");
const path = require("path");

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";

    if (file.fieldname === "photo") {
      uploadPath = "src/uploads/avatars/";
    } else if (file.fieldname === "image") {
      uploadPath = "src/uploads/images/";
    } else if (file.fieldname === "file") {
      uploadPath = "src/uploads/messages/";
    } else {
      return cb(new AppError("Không xác định fieldname!", 400), false);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    let fileName = "";
    const ext = path.extname(file.originalname);

    if (file.fieldname === "photo") {
      fileName = `user-${req.user.id}-${Date.now()}${ext}`;
    } else if (file.fieldname === "image") {
      fileName = `image-${Date.now()}${ext}`;
    } else if (file.fieldname === "file") {
      fileName = `message-${Date.now()}${ext}`;
    }

    cb(null, fileName);
  }
});

// Lọc file (chỉ cho phép hình ảnh và các loại file cho message)
const fileFilter = (req, file, cb) => {
  const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

  const allowedMessageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "application/pdf"
  ];

  if (
    file.fieldname === "photo" &&
    allowedImageMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "image" &&
    allowedImageMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "file" &&
    allowedMessageMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    let errorMessage = "Loại file không được hỗ trợ.";
    if (file.fieldname === "photo" || file.fieldname === "image") {
      errorMessage = "Chỉ cho phép hình ảnh cho avatar và image.";
    } else if (file.fieldname === "file") {
      errorMessage = "Chỉ cho phép hình ảnh, video và PDF cho tin nhắn.";
    }
    cb(new AppError(errorMessage, 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Giới hạn kích thước file (5MB)
  }
});

// Middleware kết hợp (Sửa đổi ở đây)
exports.uploadBoth = (req, res, next) => {
  upload.fields([
    { name: "file", maxCount: 1 }, // 'file' cho các file đính kèm
    { name: "image", maxCount: 1 } // 'image' cho ảnh
  ])(req, res, function (err) {
    if (err) {
      // Xử lý lỗi Multer
      console.error("Multer Error:", err);
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError("Kích thước file quá lớn (tối đa 5MB).", 400)
          );
        }
        return next(new AppError(`Lỗi upload: ${err.message}`, 400));
      } else {
        return next(new AppError(`Lỗi server: ${err.message}`, 500));
      }
    }
    next(); // Chuyển đến middleware tiếp theo nếu không có lỗi
  });
};

exports.uploadUserPhoto = upload.single("photo"); // 'photo' là tên field trong form data (avatar)
exports.uploadImage = upload.single("image"); // 'image' là tên field trong form data (ảnh chung)
exports.uploadMessageFile = upload.single("file"); // 'file' là tên field trong form data (tin nhắn)
