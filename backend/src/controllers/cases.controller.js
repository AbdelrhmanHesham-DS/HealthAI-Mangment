const SymptomCase = require('../models/SymptomCase');

// GET /api/cases
exports.getCases = async (req, res) => {
  try {
    const cases = await SymptomCase.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cases
exports.createCase = async (req, res) => {
  try {
    const { title, answers, result, mode } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const c = await SymptomCase.create({ userId: req.user.id, title, answers: answers || {}, result: result || {}, mode: mode || 'chat' });
    res.status(201).json(c);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/cases/:id
exports.getCaseById = async (req, res) => {
  try {
    const c = await SymptomCase.findOne({ _id: req.params.id, userId: req.user.id });
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cases/:id
exports.deleteCase = async (req, res) => {
  try {
    await SymptomCase.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Case deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
