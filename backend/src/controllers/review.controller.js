const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// GET /api/reviews?doctorId=...
exports.getReviews = async (req, res) => {
  try {
    const filter = req.query.doctorId ? { doctorId: req.query.doctorId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      patientId:   req.user.id,
      patientName: req.user.name,
      verified:    true,
    });

    // Recalculate doctor's average rating
    const allReviews = await Review.find({ doctorId: req.body.doctorId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Doctor.findByIdAndUpdate(req.body.doctorId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/reviews/:id  (admin only)
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
