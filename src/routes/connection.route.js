const express =require("express");
const connectionController = require("../controllers/connection.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/request", authMiddleware.protect,connectionController.sendRequest);
router.put("/:id/accept", authMiddleware.protect, connectionController.acceptRequest);
router.delete("/:id/reject", authMiddleware.protect,connectionController.rejectRequest);
router.delete("/disconnect", authMiddleware.protect,connectionController.disconnect);
router.get("/pending", authMiddleware.protect, connectionController.getPendingrequests);

module.exports = router;