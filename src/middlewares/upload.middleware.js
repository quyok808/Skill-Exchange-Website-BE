const multer = require("multer");
const AppError = require("../utils/appError");
const cloudinary = require("../configs/cloudinary");
const { Readable } = require("stream");

// Cấu hình lưu trữ tạm thời trong bộ nhớ
const storage = multer.memoryStorage();

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
    let errorMessage =
      file.fieldname === "photo" || file.fieldname === "image"
        ? "Chỉ cho phép hình ảnh cho avatar và image."
        : "Chỉ cho phép hình ảnh, video và PDF cho tin nhắn.";
    cb(new AppError(errorMessage, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

// Hàm upload lên Cloudinary
const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(file.buffer).pipe(stream);
  });

// Middleware xử lý upload
exports.uploadBoth = (req, res, next) =>
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Kích thước file quá lớn (tối đa 5MB).", 400));
      }
      return next(new AppError(`Lỗi upload: ${err.message}`, 400));
    }

    try {
      if (req.files) {
        if (req.files["image"]) {
          const result = await uploadToCloudinary(
            req.files["image"][0],
            "images"
          );
          req.imageUrl = result.secure_url;
        }
        if (req.files["file"]) {
          const result = await uploadToCloudinary(
            req.files["file"][0],
            "messages"
          );
          req.fileUrl = result.secure_url;
        }
      }
      next();
    } catch (error) {
      next(new AppError(`Lỗi upload lên Cloudinary: ${error.message}`, 500));
    }
  });

exports.uploadUserPhoto = (req, res, next) =>
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Kích thước file quá lớn (tối đa 5MB).", 400));
      }
      return next(new AppError(`Lỗi upload: ${err.message}`, 400));
    }
    try {
      const result = await uploadToCloudinary(req.file, "avatars");
      req.photoUrl = result.secure_url;
      next();
    } catch (error) {
      next(new AppError(`Lỗi upload lên Cloudinary: ${error.message}`, 500));
    }
  });

exports.uploadImage = (req, res, next) =>
  upload.single("image")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Kích thước file quá lớn (tối đa 5MB).", 400));
      }
      return next(new AppError(`Lỗi upload: ${err.message}`, 400));
    }
    try {
      const result = await uploadToCloudinary(req.file, "images");
      req.imageUrl = result.secure_url;
      next();
    } catch (error) {
      next(new AppError(`Lỗi upload lên Cloudinary: ${error.message}`, 500));
    }
  });

exports.uploadMessageFile = (req, res, next) =>
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Kích thước file quá lớn (tối đa 5MB).", 400));
      }
      return next(new AppError(`Lỗi upload: ${err.message}`, 400));
    }
    try {
      const result = await uploadToCloudinary(req.file, "messages");
      req.fileUrl = result.secure_url;
      next();
    } catch (error) {
      next(new AppError(`Lỗi upload lên Cloudinary: ${error.message}`, 500));
    }
  });
