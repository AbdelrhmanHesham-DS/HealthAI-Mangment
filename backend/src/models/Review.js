const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  patientName:   String,
  patientAvatar: String,
  rating:        { type: Number, min: 1, max: 5, required: true },
  comment:       { type: String, default: '' },
  visitType:     { type: String, enum: ['in-person', 'video', 'chat'] },
  verified:      { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
