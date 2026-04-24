const mongoose = require('mongoose');

const consultationContextSchema = new mongoose.Schema({
  consultationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  contextSnapshot: {
    recentMetrics: mongoose.Schema.Types.Mixed,
    medicalHistory: mongoose.Schema.Types.Mixed,
    aiInsights: [String]
  },
  aiInteractions: [{
    timestamp: { type: Date, default: Date.now },
    query: String,
    response: String,
    contextUsed: Boolean
  }]
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { 
      ret.id = ret._id; 
      delete ret._id; 
      delete ret.__v; 
      return ret; 
    }
  }
});

// Add indexes for efficient querying
consultationContextSchema.index({ consultationId: 1 });
consultationContextSchema.index({ patientId: 1, startTime: -1 });
consultationContextSchema.index({ doctorId: 1, startTime: -1 });

module.exports = mongoose.model('ConsultationContext', consultationContextSchema);
