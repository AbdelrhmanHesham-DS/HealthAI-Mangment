const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'user_created', 'user_updated', 'user_deleted', 'doctor_approved', etc.
  details: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Target user if applicable
  targetType: { type: String }, // 'user', 'appointment', 'review', etc.
  targetId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String },
  userAgent: { type: String },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
