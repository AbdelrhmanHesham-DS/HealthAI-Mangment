const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const Review = require('../models/Review');
    
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

    // Calculate real satisfaction rate from reviews
    const reviews = await Review.find();
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    const satisfaction = Math.round((avgRating / 5) * 100);

    // Get real chart data - appointments per day for last 14 days
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = await Appointment.countDocuments({ date: dateStr });
      chartData.push(count);
    }

    // Additional stats
    const completedCount = await Appointment.countDocuments({ status: 'completed' });
    const cancelledCount = await Appointment.countDocuments({ status: 'cancelled' });
    const upcomingCount = await Appointment.countDocuments({ status: 'upcoming' });
    const totalReviews = reviews.length;
    const newPatientsThisMonth = await User.countDocuments({
      role: 'patient',
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });
    const newDoctorsThisMonth = await User.countDocuments({
      role: 'doctor',
      approvalStatus: 'approved',
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    res.json({
      totalPatients, 
      totalDoctors, 
      totalAppointments, 
      todayAppointments,
      totalChats, 
      revenue, 
      satisfaction, 
      pendingDoctors,
      chartData,
      completedCount,
      cancelledCount,
      upcomingCount,
      totalReviews,
      avgRating: avgRating.toFixed(1),
      newPatientsThisMonth,
      newDoctorsThisMonth,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users?role=patient|doctor|all&search=query&specialty=value&status=value
exports.getUsers = async (req, res) => {
  try {
    const { role, search, specialty, status, minRating, maxRating } = req.query;
    const filter = {};
    
    if (role && role !== 'all') filter.role = role;
    if (specialty) filter.specialty = specialty;
    if (status) filter.approvalStatus = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxRating) filter.rating = { ...filter.rating, $lte: parseFloat(maxRating) };
    
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

// PUT /api/admin/users/:id - Update user data
exports.updateUser = async (req, res) => {
  try {
    const { 
      name, email, phone, address, specialty, experience, consultationFee, 
      bio, education, languages, password, role, approved, approvalStatus,
      certificateUrl, clinicName
    } = req.body;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (specialty) updateData.specialty = specialty;
    if (experience !== undefined) updateData.experience = experience;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (bio !== undefined) updateData.bio = bio;
    if (education) updateData.education = education;
    if (languages) updateData.languages = languages;
    if (role) updateData.role = role;
    if (approved !== undefined) updateData.approved = approved;
    if (approvalStatus) updateData.approvalStatus = approvalStatus;
    if (certificateUrl !== undefined) updateData.certificateUrl = certificateUrl;
    if (clinicName !== undefined) updateData.clinicName = clinicName;
    
    // Hash password if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/users/:id - Get single user details
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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
      .populate('doctorId', 'name specialty avatar')
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reviews - Get all reviews with doctor and patient info
exports.getAllReviews = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find()
      .populate('doctorId', 'name specialty')
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/reviews/:id - Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const Review = require('../models/Review');
    await Review.findByIdAndDelete(req.params.id);
    
    // Recalculate doctor rating
    const review = await Review.findById(req.params.id);
    if (review) {
      const doctorReviews = await Review.find({ doctorId: review.doctorId });
      const avgRating = doctorReviews.length > 0
        ? doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length
        : 0;
      await User.findByIdAndUpdate(review.doctorId, { rating: avgRating.toFixed(1) });
    }
    
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/appointments/:id/status - Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('doctorId', 'name specialty').populate('patientId', 'name email');
    
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/dashboard-summary - Get comprehensive dashboard data
exports.getDashboardSummary = async (req, res) => {
  try {
    const Review = require('../models/Review');
    
    // Recent activity
    const recentAppointments = await Appointment.find()
      .populate('doctorId', 'name specialty avatar')
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const recentPatients = await User.find({ role: 'patient' })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentDoctors = await User.find({ role: 'doctor', approvalStatus: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentReviews = await Review.find()
      .populate('doctorId', 'name specialty')
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Top doctors by rating
    const topDoctors = await User.find({ role: 'doctor', approvalStatus: 'approved' })
      .sort({ rating: -1 })
      .limit(5);
    
    res.json({
      recentAppointments,
      recentPatients,
      recentDoctors,
      recentReviews,
      topDoctors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics/revenue - Revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let groupBy;
    let dateRange = new Date();
    
    if (period === 'day') {
      dateRange.setDate(dateRange.getDate() - 30);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'week') {
      dateRange.setDate(dateRange.getDate() - 90);
      groupBy = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
    } else if (period === 'month') {
      dateRange.setMonth(dateRange.getMonth() - 12);
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      dateRange.setFullYear(dateRange.getFullYear() - 5);
      groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
    }
    
    const revenueData = await Appointment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: dateRange } } },
      { $group: { _id: groupBy, revenue: { $sum: '$fee' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Revenue by doctor
    const revenueByDoctor = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$doctorId', revenue: { $sum: '$fee' }, appointments: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    const doctorIds = revenueByDoctor.map(d => d._id);
    const doctors = await User.find({ _id: { $in: doctorIds } }).select('name specialty');
    const doctorMap = {};
    doctors.forEach(d => doctorMap[d._id] = d);
    
    const enrichedRevenueByDoctor = revenueByDoctor.map(r => ({
      doctor: doctorMap[r._id],
      revenue: r.revenue,
      appointments: r.appointments
    }));
    
    res.json({ revenueData, revenueByDoctor: enrichedRevenueByDoctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics/appointments - Appointment analytics
exports.getAppointmentAnalytics = async (req, res) => {
  try {
    // Appointments by specialty
    const bySpecialty = await Appointment.aggregate([
      { $lookup: { from: 'users', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $group: { _id: '$doctor.specialty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Appointments by type
    const byType = await Appointment.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Appointments by status
    const byStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Peak hours
    const peakHours = await Appointment.aggregate([
      { $project: { hour: { $hour: { $dateFromString: { dateString: { $concat: ['$date', 'T', '$time'] } } } } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Cancellation rate
    const total = await Appointment.countDocuments();
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(2) : 0;
    
    res.json({ bySpecialty, byType, byStatus, peakHours, cancellationRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics/doctors - Doctor performance analytics
exports.getDoctorAnalytics = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', approvalStatus: 'approved' });
    
    const doctorStats = await Promise.all(doctors.map(async (doctor) => {
      const appointments = await Appointment.countDocuments({ doctorId: doctor._id });
      const completed = await Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' });
      const cancelled = await Appointment.countDocuments({ doctorId: doctor._id, status: 'cancelled' });
      const revenue = await Appointment.aggregate([
        { $match: { doctorId: doctor._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fee' } } }
      ]);
      
      return {
        doctor: { id: doctor._id, name: doctor.name, specialty: doctor.specialty, rating: doctor.rating },
        appointments,
        completed,
        cancelled,
        revenue: revenue[0]?.total || 0,
        completionRate: appointments > 0 ? ((completed / appointments) * 100).toFixed(2) : 0
      };
    }));
    
    doctorStats.sort((a, b) => b.revenue - a.revenue);
    
    res.json(doctorStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics/patients - Patient analytics
exports.getPatientAnalytics = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const activePatients = await Appointment.distinct('patientId');
    const retentionRate = totalPatients > 0 ? ((activePatients.length / totalPatients) * 100).toFixed(2) : 0;
    
    // Patients by appointment count
    const patientAppointments = await Appointment.aggregate([
      { $group: { _id: '$patientId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const patientIds = patientAppointments.map(p => p._id);
    const patients = await User.find({ _id: { $in: patientIds } }).select('name email');
    const patientMap = {};
    patients.forEach(p => patientMap[p._id] = p);
    
    const topPatients = patientAppointments.map(p => ({
      patient: patientMap[p._id],
      appointments: p.count
    }));
    
    res.json({ totalPatients, activePatients: activePatients.length, retentionRate, topPatients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/bulk/approve-doctors - Bulk approve doctors
exports.bulkApproveDoctors = async (req, res) => {
  try {
    const { ids } = req.body;
    await User.updateMany(
      { _id: { $in: ids }, role: 'doctor' },
      { approved: true, approvalStatus: 'approved' }
    );
    
    // Send notifications
    for (const id of ids) {
      await Notification.create({
        userId: id,
        title: 'Account Approved',
        message: 'Your doctor account has been approved.',
        type: 'system',
      });
    }
    
    res.json({ message: `${ids.length} doctors approved` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/admin/bulk/reject-doctors - Bulk reject doctors
exports.bulkRejectDoctors = async (req, res) => {
  try {
    const { ids } = req.body;
    await User.updateMany(
      { _id: { $in: ids }, role: 'doctor' },
      { approved: false, approvalStatus: 'rejected' }
    );
    
    for (const id of ids) {
      await Notification.create({
        userId: id,
        title: 'Account Rejected',
        message: 'Your doctor account application was not approved.',
        type: 'system',
      });
    }
    
    res.json({ message: `${ids.length} doctors rejected` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/admin/bulk/delete-users - Bulk delete users
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${ids.length} users deleted` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/admin/notifications/send - Send notification to users
exports.sendNotification = async (req, res) => {
  try {
    const { userIds, title, message, type = 'system' } = req.body;
    
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
    }));
    
    await Notification.insertMany(notifications);
    res.json({ message: `Notification sent to ${userIds.length} users` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/admin/notifications/broadcast - Broadcast to all users
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, role, type = 'system' } = req.body;
    
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('_id');
    
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type,
    }));
    
    await Notification.insertMany(notifications);
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/activity-logs - Get activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { limit = 50, skip = 0, action, userId } = req.query;
    
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await ActivityLog.countDocuments(filter);
    
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/activity-logs - Create activity log
exports.createActivityLog = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { action, details, userId, targetType, targetId } = req.body;
    
    await ActivityLog.create({
      adminId: req.user._id,
      action,
      details,
      userId,
      targetType,
      targetId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ message: 'Activity logged' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/export/users - Export users to CSV
exports.exportUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    
    // Convert to CSV
    const csv = [
      ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'].join(','),
      ...users.map(u => [
        u._id,
        u.name,
        u.email,
        u.phone || '',
        u.role,
        u.approvalStatus || 'N/A',
        u.createdAt
      ].join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/export/appointments - Export appointments to CSV
exports.exportAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'name specialty')
      .populate('patientId', 'name email');
    
    const csv = [
      ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Fee'].join(','),
      ...appointments.map(a => [
        a._id,
        a.patientId?.name || 'Unknown',
        a.doctorId?.name || 'Unknown',
        a.date,
        a.time,
        a.type,
        a.status,
        a.fee
      ].join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/appointments - Create appointment for patient
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, reason, notes, fee } = req.body;
    
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      time,
      type,
      reason,
      notes,
      fee,
      status: 'upcoming'
    });
    
    // Populate doctor and patient info
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialty avatar')
      .populate('patientId', 'name email phone');
    
    // Send notification to patient
    await Notification.create({
      userId: patientId,
      title: 'New Appointment Booked',
      message: `An appointment has been booked for you with Dr. ${populatedAppointment.doctorId?.name} on ${date} at ${time}`,
      type: 'appointment',
    });
    
    res.json(populatedAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/admin/appointments/:id - Update appointment details
exports.updateAppointment = async (req, res) => {
  try {
    const { date, time, type, reason, notes, fee, status } = req.body;
    
    const updateData = {};
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (type) updateData.type = type;
    if (reason) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (fee !== undefined) updateData.fee = fee;
    if (status) updateData.status = status;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('doctorId', 'name specialty avatar').populate('patientId', 'name email');
    
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Notify patient of changes
    await Notification.create({
      userId: appointment.patientId._id,
      title: 'Appointment Updated',
      message: `Your appointment with Dr. ${appointment.doctorId?.name} has been updated`,
      type: 'appointment',
    });
    
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/admin/appointments/:id - Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Notify patient
    await Notification.create({
      userId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: 'Your appointment has been cancelled by the administrator',
      type: 'appointment',
    });
    
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
