const express = require("express");
const appointmentController = require("../controllers/appointment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect); // Yêu cầu xác thực cho tất cả các route dưới đây

router.post("/", appointmentController.createAppointment);
router.get("/:id", appointmentController.getAppointment);
router.put("/:id", appointmentController.updateAppointment);
router.delete("/:id", appointmentController.deleteAppointment);
router.get("/", appointmentController.getMyAppointments);
router.put("/:id", appointmentController.updateAppointmentStatus);

module.exports = router;
