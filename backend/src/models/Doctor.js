const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  id:        String,
  time:      String,
  available: { type: Boolean, default: true },
}, { _id: false });

const daySlotsSchema = new mongoose.Schema({
  day:   String,
  date:  String,
  slots: [timeSlotSchema],
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  // Link to User account (optional — doctor may not have a login yet)
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:            { type: String, required: true },
  specialty:       { type: String, required: true },
  specialtyKey:    { type: String, required: true },
  avatar:          { type: String, default: '' },
  photo:           { type: String, default: '' },
  rating:          { type: Number, default: 0 },
  reviewCount:     { type: Number, default: 0 },
  experience:      { type: Number, default: 0 },
  city:            { type: String, default: '' },
  location:        { type: String, default: '' },
  address:         { type: String, default: '' },
  languages:       [String],
  bio:             { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },
  nextAvailable:   { type: String, default: 'Today' },
  verified:        { type: Boolean, default: false },
  online:          { type: Boolean, default: false },
  waitTime:        { type: String, default: '' },
  insurances:      [String],
  education:       [String],
  clinicName:      { type: String, default: '' },
  availability:    [daySlotsSchema],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('Doctor', doctorSchema);
