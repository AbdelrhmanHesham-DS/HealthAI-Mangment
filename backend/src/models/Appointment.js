const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  slotId:          { type: String, default: '' },
  doctorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  doctorName:      String,
  doctorSpecialty: String,
  doctorAvatar:    String,
  doctorPhoto:     String,
  patientName:     String,
  date:            { type: String, required: true },
  time:            { type: String, required: true },
  type:            { type: String, enum: ['in-person', 'video', 'chat'], default: 'in-person' },
  status:          { type: String, enum: ['upcoming', 'completed', 'cancelled', 'pending'], default: 'upcoming' },
  reason:          { type: String, default: '' },
  notes:           { type: String, default: '' },
  fee:             { type: Number, default: 0 },
  reviewed:        { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
