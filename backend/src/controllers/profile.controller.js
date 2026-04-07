const User = require('../models/User');

// GET /api/profile - Get current user's full profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/profile - Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'avatar', 'dateOfBirth', 'gender', 'address',
      'specialty', 'certificateUrl', 'idDocument', 'experience', 'bio', 'education', 'languages'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/profile/:id - Get any user's public profile (admin only)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
