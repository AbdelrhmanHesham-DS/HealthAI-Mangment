const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['blood_pressure', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'oxygen', 'steps'], required: true },
  value:     { type: Number, required: true },
  value2:    { type: Number }, // for blood pressure (diastolic)
  unit:      { type: String, required: true },
  note:      { type: String, default: '' },
  recordedAt:{ type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
