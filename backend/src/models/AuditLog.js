import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only require log creation timestamp
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
