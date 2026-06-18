import AuditLog from '../models/AuditLog.js';

/**
 * Log a user or system activity to the audit database.
 * @param {string} userId - Mongoose ObjectId of the user, or null if system/unauthenticated
 * @param {string} action - Action descriptor (e.g. 'USER_LOGIN', 'PRODUCT_REJECTED')
 * @param {object} details - Arbitrary meta key-value pairs
 * @param {string} ipAddress - Client IP address
 */
export const logActivity = async (userId, action, details = {}, ipAddress = '') => {
  try {
    await AuditLog.create({
      user: userId || null,
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error(`Audit Log Fail [${action}]: ${error.message}`);
  }
};
