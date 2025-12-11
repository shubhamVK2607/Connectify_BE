// message.model.js
import mongoose from "mongoose";
import User from "./user.model.js";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true
    },
    text: {
      type: String
    },
    image: {
      type: String
    },
    status: {
      type: String,
      enum: ['sent', 'seen'],
      default: 'sent'
    }
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;