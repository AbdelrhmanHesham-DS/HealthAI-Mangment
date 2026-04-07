const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content:   { type: String, required: true },
  role:      { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, default: 'New Conversation' },
  language: { type: String, default: 'en' },
  messages: [messageSchema],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
