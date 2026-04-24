const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { 
    type: String, 
    enum: [
      // Existing types
      'blood_pressure', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'oxygen', 'steps',
      // Blood level types
      'hemoglobin', 'white_blood_cells', 'platelets', 'red_blood_cells',
      'hematocrit', 'mcv', 'mch', 'mchc',
      // Sugar level types
      'fasting_glucose', 'postprandial_glucose', 'hba1c', 'random_glucose',
      // Other common metrics
      'cholesterol_total', 'ldl', 'hdl', 'triglycerides',
      'creatinine', 'bun', 'alt', 'ast'
    ], 
    required: true 
  },
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

// Add indexes for efficient querying
healthMetricSchema.index({ patientId: 1, type: 1, recordedAt: -1 });
healthMetricSchema.index({ patientId: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
