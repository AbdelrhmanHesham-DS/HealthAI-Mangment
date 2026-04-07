const mongoose = require('mongoose');

const symptomCaseSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  answers: { type: Object, default: {} },
  result: {
    urgency:        String,
    condition:      String,
    specialty:      String,
    specialtyKey:   String,
    recommendation: String,
    confidence:     Number,
    source:         String,
  },
  mode: { type: String, enum: ['flow', 'chat'], default: 'chat' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('SymptomCase', symptomCaseSchema);
