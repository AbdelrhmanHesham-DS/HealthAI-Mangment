const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');

// GET /api/appointments  — patient sees own, doctor sees theirs, admin sees all
exports.getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') filter.patientId = req.user.id;
    else if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc) filter.doctorId = doc._id;
    }
    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'name specialty photo avatar')
      .populate('patientId', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/appointments
exports.createAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.body.doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const { date, time, slotId } = req.body;

    // Prevent double booking — check slot availability first
    if (slotId) {
      let slotTaken = false;
      for (const day of doctor.availability) {
        const slot = day.slots.find(s => s.id === slotId);
        if (slot && !slot.available) { slotTaken = true; break; }
      }
      if (slotTaken) {
        return res.status(409).json({ message: 'This time slot has already been booked. Please choose another.' });
      }
    }

    // Also check if there's already an appointment for this doctor at this date/time
    const existingAppointment = await Appointment.findOne({
      doctorId: req.body.doctorId,
      date,
      time,
      status: { $in: ['upcoming', 'pending'] }, // Don't count cancelled/completed
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot has already been booked. Please choose another time.' });
    }

    const apt = await Appointment.create({
      ...req.body,
      patientId:       req.user.id,
      patientName:     req.user.name,
      doctorName:      doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar:    doctor.avatar,
      doctorPhoto:     doctor.photo,
      fee:             doctor.consultationFee,
    });

    // Lock the slot — no one else can book it now
    if (slotId) {
      await Doctor.updateOne(
        { _id: doctor._id },
        { $set: { 'availability.$[].slots.$[slot].available': false } },
        { arrayFilters: [{ 'slot.id': slotId }] }
      );
    }

    await Notification.create({
      userId:  req.user.id,
      title:   'Appointment Booked',
      message: `Your appointment with ${doctor.name} on ${apt.date} at ${apt.time} is confirmed.`,
      type:    'appointment',
    });

    // Real-time push to patient
    const io          = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const patientSocketId = userSockets.get(String(req.user.id));
    if (io && patientSocketId) {
      io.to(patientSocketId).emit('notification', {
        title:   'Appointment Booked',
        message: `Your appointment with ${doctor.name} on ${apt.date} at ${apt.time} is confirmed.`,
        type:    'appointment',
      });
    }

    res.status(201).json(apt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name specialty photo avatar clinicName address')
      .populate('patientId', 'name email phone');
    if (!apt) return res.status(404).json({ message: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/appointments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const apt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!apt) return res.status(404).json({ message: 'Appointment not found' });

    // Notify patient in real-time
    const io          = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const patientSocketId = userSockets?.get(String(apt.patientId));
    if (io && patientSocketId) {
      io.to(patientSocketId).emit('notification', {
        title:   `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your appointment on ${apt.date} at ${apt.time} has been marked as ${status}.`,
        type:    'appointment',
      });
    }

    res.json(apt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!apt) return res.status(404).json({ message: 'Appointment not found' });

    // Unlock the slot so it can be rebooked
    if (apt.slotId) {
      await Doctor.updateOne(
        { _id: apt.doctorId },
        { $set: { 'availability.$[].slots.$[slot].available': true } },
        { arrayFilters: [{ 'slot.id': apt.slotId }] }
      );
    }

    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/appointments/:id/reviewed
exports.markReviewed = async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(req.params.id, { reviewed: true }, { new: true });
    res.json(apt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id — General update (for status, notes, etc.)
exports.updateAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, $or: [{ patientId: req.user.id }, { doctorId: req.user.id }] },
      req.body,
      { new: true, runValidators: true }
    );
    if (!apt) return res.status(404).json({ message: 'Appointment not found' });

    // If status changed to cancelled, unlock the slot
    if (req.body.status === 'cancelled' && apt.slotId) {
      await Doctor.updateOne(
        { _id: apt.doctorId },
        { $set: { 'availability.$[].slots.$[slot].available': true } },
        { arrayFilters: [{ 'slot.id': apt.slotId }] }
      );
    }

    res.json(apt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/appointments/admin — Admin books appointment for themselves
exports.createAdminAppointment = async (req, res) => {
  try {
    // Verify admin is authenticated and has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can book appointments for themselves' });
    }

    const { doctorId, date, time, slotId } = req.body;

    // Verify selected doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Verify time slot is within doctor's working hours and available
    let slotAvailable = false;
    if (slotId) {
      for (const day of doctor.availability) {
        const slot = day.slots.find(s => s.id === slotId);
        if (slot && slot.available) {
          slotAvailable = true;
          break;
        }
      }
      if (!slotAvailable) {
        return res.status(409).json({ message: 'This time slot is not available. Please choose another.' });
      }
    }

    // Prevent double-booking — check if there's already an appointment for this doctor at this date/time
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ['upcoming', 'pending'] },
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot has already been booked. Please choose another time.' });
    }

    // Create appointment with admin as patient
    const apt = await Appointment.create({
      doctorId,
      patientId: req.user.id,
      date,
      time,
      slotId: slotId || '',
      patientName: req.user.name,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatar,
      doctorPhoto: doctor.photo,
      fee: doctor.consultationFee,
      type: req.body.type || 'in-person',
      reason: req.body.reason || '',
      status: 'upcoming',
    });

    // Lock the slot — no one else can book it now
    if (slotId) {
      await Doctor.updateOne(
        { _id: doctorId },
        { $set: { 'availability.$[].slots.$[slot].available': false } },
        { arrayFilters: [{ 'slot.id': slotId }] }
      );
    }

    // Create notification for admin
    await Notification.create({
      userId: req.user.id,
      title: 'Appointment Booked',
      message: `Your appointment with ${doctor.name} on ${apt.date} at ${apt.time} is confirmed.`,
      type: 'appointment',
    });

    // Create notification for doctor
    if (doctor.userId) {
      await Notification.create({
        userId: doctor.userId,
        title: 'New Appointment',
        message: `Admin ${req.user.name} has booked an appointment on ${apt.date} at ${apt.time}.`,
        type: 'appointment',
      });
    }

    // Real-time push to admin
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const adminSocketId = userSockets?.get(String(req.user.id));
    if (io && adminSocketId) {
      io.to(adminSocketId).emit('notification', {
        title: 'Appointment Booked',
        message: `Your appointment with ${doctor.name} on ${apt.date} at ${apt.time} is confirmed.`,
        type: 'appointment',
      });
    }

    // Real-time push to doctor
    if (doctor.userId) {
      const doctorSocketId = userSockets?.get(String(doctor.userId));
      if (io && doctorSocketId) {
        io.to(doctorSocketId).emit('notification', {
          title: 'New Appointment',
          message: `Admin ${req.user.name} has booked an appointment on ${apt.date} at ${apt.time}.`,
          type: 'appointment',
        });
      }
    }

    res.status(201).json(apt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
