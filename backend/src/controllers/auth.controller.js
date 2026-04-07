const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialty, certificateUrl, experience, bio, education, languages, gender, dateOfBirth, address } = req.body;

    // Validate types
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already in use' });

    const userData = {
      name, email, password, phone: phone || '',
      role: role || 'patient',
    };

    // Doctors start as pending until admin approves
    if (role === 'doctor') {
      userData.specialty = specialty || '';
      userData.certificateUrl = certificateUrl || '';
      userData.experience = experience || 0;
      userData.bio = bio || '';
      userData.education = education || [];
      userData.languages = languages || ['English'];
      userData.approved = false;
      userData.approvalStatus = 'pending';
    } else {
      // Patient or admin
      userData.gender = gender || '';
      userData.dateOfBirth = dateOfBirth || null;
      userData.address = address || '';
      userData.approved = true;
      userData.approvalStatus = 'approved';
    }

    const user = await User.create(userData);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate types — reject if email/password are not strings (NoSQL injection attempt)
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials format' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Doctors must be approved
    if (user.role === 'doctor' && user.approvalStatus !== 'approved')
      return res.status(403).json({
        message: user.approvalStatus === 'rejected'
          ? 'Your account has been rejected. Please contact support.'
          : 'Your account is pending admin approval. You will be notified once approved.'
      });

    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'avatar', 'dateOfBirth', 'gender', 'address', 'specialty', 'certificateUrl', 'idDocument', 'experience', 'bio', 'education', 'languages'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/upload-avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/upload-id-document
exports.uploadIdDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Only doctors can upload ID documents
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can upload ID documents' });
    }

    const documentUrl = `/uploads/documents/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { idDocument: documentUrl },
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'ID document uploaded successfully',
      idDocument: documentUrl,
      user 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
