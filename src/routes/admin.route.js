const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

// Các route cần xác thực (chỉ role admin mới có quyền)
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin")); // Áp dụng middleware cho các route phía dưới
router.get("/", adminController.getAllUsers);
// router.get("/:id", userController.getUser);
router.delete("/:id", adminController.deleteUser);
router.put("/lock/:id", adminController.lockUser);
router.put("/change-role/:id", adminController.changeRole);
router.get("/connection-report", adminController.getConnectionReports);

module.exports = router;
