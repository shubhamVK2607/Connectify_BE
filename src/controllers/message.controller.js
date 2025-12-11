import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import ConnectionRequest from "../models/connectionRequest.model.js";

const USER_SAFE_DATA = ["fullName", "photoURL"];

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectedUser = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);
    
    const data = connectedUser.map((row) =>
      row.fromUserId._id.toString() === loggedInUser._id.toString()
        ? row.toUserId
        : row.fromUserId
    );
    
    res.status(200).json({
      message: "data fetched successfully",
      data: { length: data.length, data },
    });
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation time
    
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: 'sent', // Default status is sent
    });
    
    await newMessage.save();
    
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params; // The person who sent the messages
    const myId = req.user._id; // Current user (receiver)

    // Update all unread messages from senderId to myId
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: myId,
        status: 'sent'
      },
      {
        $set: { status: 'seen' }
      }
    );

    // Emit socket event to sender that messages were seen
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { 
        userId: myId.toString() 
      });
    }

    res.status(200).json({ 
      message: "Messages marked as seen",
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.log("Error in markMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user._id;

    // Count all messages sent to current user with status 'sent'
    const unreadCount = await Message.countDocuments({
      receiverId: myId,
      status: 'sent'
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.log("Error in getUnreadCount controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};