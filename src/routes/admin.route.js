const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

// Các route cần xác thực (chỉ role admin mới có quyền)
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin")); // Áp dụng middleware cho các route phía dưới
router.get("/", adminController.getAllUsers);
// router.get("/:id", userController.getUser);
// router.put("/:id", userController.updateUser);
router.delete("/:id", adminController.deleteUser);

module.exports = router;
