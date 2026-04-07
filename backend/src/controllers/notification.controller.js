const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notifications/menu - Get recent notifications for navbar menu
exports.getNotificationMenu = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5; // Default 5 notifications
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    
    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json(n);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
