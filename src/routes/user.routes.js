const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");
const {
  validateRegister,
  validateResetPassword,
} = require("../middlewares/validate.middleware");

const router = express.Router();

router.post("/register", validateRegister, userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword); // Route để quên mật khẩu
router.put(
  "/reset-password/:token",
  validateResetPassword,
  userController.resetPassword
); // Route để reset mật khẩu
router.get("/verify-email/:token", userController.verifyEmail); // Route để xác thực email
router.post("/logout", authMiddleware.protect, userController.logout); // Thêm route logout

router.use(authMiddleware.protect); // Apply protect middleware
// Các route cần xác thực (Tất cả role)
router.put(
  "/upload-photo",
  uploadMiddleware.uploadUserPhoto,
  userController.uploadUserPhoto
); //Route upload ảnh, cần user đã login
router.post("/send-verification-email", userController.sendVerificationEmail);
router.put(
  "/change-password",
  validateResetPassword,
  userController.changePassword
);
router.get("/me", userController.getMe);
router.put("/update-profile", userController.updateMe);
router.get("/search-user", userController.searchUser);
router.put("/add-skill", userController.addSkillToUser);
router.get("/profile/image", userController.getImage); // Route để lấy ảnh avatar
router.get("/profile/image/:id", userController.getImageById);
// Các route cần xác thực (chỉ role admin mới có quyền)
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin")); // Áp dụng middleware cho các route phía dưới
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
