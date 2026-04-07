const Doctor = require('../models/Doctor');

// GET /api/doctors
exports.getDoctors = async (req, res) => {
  try {
    const { query, specialty, city, visitType, minRating, maxFee, availableToday } = req.query;
    const filter = {};

    if (query) {
      const re = new RegExp(query, 'i');
      filter.$or = [{ name: re }, { specialty: re }, { clinicName: re }];
    }
    if (specialty && specialty !== 'all') filter.specialtyKey = specialty;
    if (city && city !== 'all') filter.city = city;
    if (visitType === 'online') filter.online = true;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxFee) filter.consultationFee = { $lte: parseFloat(maxFee) };
    if (availableToday === 'true') filter.nextAvailable = 'Today';

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/:id
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/doctors  (admin only)
exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/doctors/:id  (admin only)
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/doctors/:id  (admin only)
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/cities
exports.getCities = async (req, res) => {
  try {
    const cities = await Doctor.distinct('city');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/symptom-check?symptoms=...
exports.symptomCheck = async (req, res) => {
  try {
    const s = (req.query.symptoms || '').toLowerCase();
    let specialtyKey = 'general';
    if (s.includes('heart') || s.includes('chest') || s.includes('palpitation')) specialtyKey = 'cardiology';
    else if (s.includes('head') || s.includes('migraine') || s.includes('dizz')) specialtyKey = 'neurology';
    else if (s.includes('skin') || s.includes('rash') || s.includes('acne')) specialtyKey = 'dermatology';
    else if (s.includes('child') || s.includes('baby') || s.includes('fever')) specialtyKey = 'pediatrics';
    else if (s.includes('bone') || s.includes('joint') || s.includes('knee') || s.includes('back')) specialtyKey = 'orthopedics';
    else if (s.includes('breath') || s.includes('lung') || s.includes('cough')) specialtyKey = 'pulmonology';
    else if (s.includes('anxi') || s.includes('depress') || s.includes('stress')) specialtyKey = 'psychiatry';

    const doctors = await Doctor.find({ specialtyKey }).limit(4);
    res.json({ specialtyKey, doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
