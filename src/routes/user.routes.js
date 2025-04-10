const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");
const {
  validateRegister,
  validateResetPassword
} = require("../middlewares/validate.middleware");

const router = express.Router();

router.post("/register", validateRegister, userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.put(
  "/reset-password/:token",
  validateResetPassword,
  userController.resetPassword
);
router.get("/verify-email/:token", userController.verifyEmail);
router.post("/logout", authMiddleware.protect, userController.logout);

router.use(authMiddleware.protect);
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
router.get("/search-user-in-network", userController.searchUserInNetwork);
router.put("/add-skill", userController.addSkillToUser);
router.get("/profile/image", userController.getImage); // Route để lấy ảnh avatar
router.get("/profile/image/:id", userController.getImageById);
router.get("/getUserID", userController.getRelatedUserIds);
router.get("/name/:id", userController.getName);

module.exports = router;
