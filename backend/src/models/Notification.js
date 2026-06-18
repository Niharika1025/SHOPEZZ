import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['order_status', 'product_approval', 'account_update', 'general'],
      default: 'general'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
