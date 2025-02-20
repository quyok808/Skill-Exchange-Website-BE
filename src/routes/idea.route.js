const express = require("express");
const ideaController = require("../controllers/idea.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/:id", ideaController.getIdea);
router.get("/", ideaController.getAllIdeas);

router.use(authMiddleware.protect); // Áp dụng middleware cho các route phía dưới

router.post("/", ideaController.createIdea);

module.exports = router;
