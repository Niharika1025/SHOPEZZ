import Notification from '../models/Notification.js';

/**
 * Persists a user notification.
 * @param {string} userId - Target user ObjectId
 * @param {string} title - Notification title
 * @param {string} message - Detailed notification body
 * @param {string} type - Notification type enum
 */
export const createNotification = async (userId, title, message, type = 'general') => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type
    });
  } catch (err) {
    console.error(`Notification creation failed for user ${userId}: ${err.message}`);
  }
};
