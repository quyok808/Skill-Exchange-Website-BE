const express = require("express");
const connectionController = require("../controllers/connection.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.use(authMiddleware.protect);

router.post("/request", connectionController.sendRequest);
router.put("/:id/accept", connectionController.acceptRequest);
router.delete("/:id/reject", connectionController.rejectRequest);
router.delete("/disconnect", connectionController.disconnect);
router.get("/", connectionController.getAllrequests);
router.get("/pending", connectionController.getPendingrequests);

module.exports = router;
