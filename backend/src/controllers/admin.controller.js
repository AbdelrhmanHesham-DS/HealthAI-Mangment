const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalAppointments, totalChats, pendingDoctors] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', approvalStatus: 'approved' }),
      Appointment.countDocuments(),
      Conversation.countDocuments(),
      User.countDocuments({ role: 'doctor', approvalStatus: 'pending' }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await Appointment.countDocuments({ date: today });
    const completed = await Appointment.find({ status: 'completed' }).select('fee');
    const revenue = completed.reduce((s, a) => s + (a.fee || 0), 0);

    res.json({
      totalPatients, totalDoctors, totalAppointments, todayAppointments,
      totalChats, revenue, satisfaction: 96, pendingDoctors,
      chartData: [65, 78, 90, 85, 110, 125, 140, 132, 158, 170, 165, 190, 210, 225],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users?role=patient|doctor|all
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role && role !== 'all' ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/pending-doctors
exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', approvalStatus: 'pending' }).sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/approve  — approve a doctor
exports.approveDoctor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true, approvalStatus: 'approved' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Notify the doctor
    await Notification.create({
      userId: user._id,
      title: 'Account Approved',
      message: 'Your doctor account has been approved. You can now log in.',
      type: 'system',
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/reject  — reject a doctor
exports.rejectDoctor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: false, approvalStatus: 'rejected' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Notification.create({
      userId: user._id,
      title: 'Account Rejected',
      message: 'Your doctor account application was not approved. Please contact support.',
      type: 'system',
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'name specialty')
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
