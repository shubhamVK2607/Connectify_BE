import express from "express";

import { protectedRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUnreadCount,
  getUsersForSidebar,
  markMessagesAsSeen,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/connections", protectedRoute, getUsersForSidebar);
router.get("/unread-count", protectedRoute, getUnreadCount); 
router.get("/:id", protectedRoute, getMessages);
router.post("/send/:id", protectedRoute, sendMessage);
router.put("/seen/:id", protectedRoute, markMessagesAsSeen); 


export default router;
