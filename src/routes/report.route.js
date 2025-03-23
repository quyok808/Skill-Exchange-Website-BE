const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.use(authMiddleware.protect);
router.post("/", reportController.createReport);
router.delete("/:id", reportController.deleteReport);
router.get("/get-warning", reportController.getWarning);
router.put("/change-status/:id", reportController.changeStatus);
// Các route cần xác thực (chỉ role admin mới có quyền)
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin")); // Áp dụng middleware cho các route phía dưới
router.get("/", reportController.getAllReports);
router.get("/:id", reportController.getReportById);

module.exports = router;
