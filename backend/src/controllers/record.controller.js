const MedicalRecord = require('../models/MedicalRecord');

// GET /api/records
exports.getRecords = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') {
      filter = { patientId: req.user.id };
    } else if (req.user.role === 'doctor') {
      // Doctors see records of patients who have appointments with them
      const Doctor = require('../models/Doctor');
      const Appointment = require('../models/Appointment');
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc) {
        const apts = await Appointment.find({ doctorId: doc._id }).distinct('patientId');
        filter = { patientId: { $in: apts } };
      }
    }
    // admin: no filter — sees all
    const records = await MedicalRecord.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/records
exports.createRecord = async (req, res) => {
  try {
    // Patients create their own; doctors/admins can specify patientId
    const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;
    const record = await MedicalRecord.create({ ...req.body, patientId });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/records/:id
exports.getRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    // Patients can only see their own
    if (req.user.role === 'patient' && record.patientId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/records/:id
exports.updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
