const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword); // Route để quên mật khẩu
router.put("/reset-password/:token", userController.resetPassword); // Route để reset mật khẩu
router.get("/verify-email/:token", userController.verifyEmail); // Route để xác thực email
router.post("/logout", authMiddleware.protect, userController.logout); // Thêm route logout

router.use(authMiddleware.protect); // Apply protect middleware

router.put(
  "/upload-photo",
  uploadMiddleware.uploadUserPhoto,
  userController.uploadUserPhoto
); //Route upload ảnh, cần user đã login
router.post("/send-verification-email", userController.sendVerificationEmail);
router.get("/me", userController.getMe);

// Các route cần xác thực (chỉ admin mới có quyền)
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin")); // Áp dụng middleware cho các route phía dưới
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
