const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:        { type: String, required: true },
  type:        { type: String, enum: ['diagnosis', 'prescription', 'lab', 'imaging', 'vaccination'], required: true },
  title:       { type: String, required: true },
  doctor:      { type: String, required: true },
  description: { type: String, default: '' },
  attachments: [String],
  tags:        [String],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
