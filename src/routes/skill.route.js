const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const skillController = require("../controllers/skill.controller");

const router = express.Router();
router.use(authMiddleware.protect); // Áp dụng middleware cho các route phía dưới

router.post("/", skillController.createSkill);
router.get("/", skillController.getAllSkill);

router.use(authMiddleware.protect, authMiddleware.restrictTo("admin"));
router.put("/:id", skillController.updateSkill);
router.delete("/:id", skillController.deleteSkill);

module.exports = router;
