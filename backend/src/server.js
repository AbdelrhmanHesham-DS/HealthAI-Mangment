require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB  = require('./config/db');

// ── Rate Limiting ─────────────────────────────────────────────────────────
// Skip rate limiting in test mode
const isTestMode = process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true';

// General API: 100 requests per 15 minutes per IP
const generalLimiter = isTestMode ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
});

// Auth routes: 10 attempts per 15 minutes (brute-force protection)
const authLimiter = isTestMode ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Report generation: 20 per hour (PDF is expensive)
const reportLimiter = isTestMode ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Report generation limit reached. Try again in 1 hour.' },
});

// ── App & Server ──────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.io — real-time notifications ──────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Map userId → socketId for targeted notifications
const userSockets = new Map();

io.on('connection', socket => {
  // Client sends their userId after connecting
  socket.on('register', userId => {
    if (userId) {
      userSockets.set(String(userId), socket.id);
      console.log(`[Socket] User ${userId} connected (${socket.id})`);
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) { userSockets.delete(uid); break; }
    }
  });
});

// Export so controllers can emit events
app.set('io', io);
app.set('userSockets', userSockets);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(mongoSanitize()); // Strip $ and . from request body/params/query

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/report/',       reportLimiter);

// Serve doctor photos
app.use('/images', express.static(path.join(__dirname, '../../public/Images')));

// Serve uploaded files (avatars and documents)
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/profile',       require('./routes/profile.routes'));
app.use('/api/doctors',       require('./routes/doctor.routes'));
app.use('/api/appointments',  require('./routes/appointment.routes'));
app.use('/api/records',       require('./routes/record.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reviews',       require('./routes/review.routes'));
app.use('/api/chat',          require('./routes/chat.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/symptom',       require('./routes/symptom.routes'));
app.use('/api/metrics',       require('./routes/health-metric.routes'));
app.use('/api/cases',         require('./routes/cases.routes'));
app.use('/api/report',        require('./routes/report.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
