const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS must run before static routes so /docs PDF responses include ACAO headers
// (otherwise fetch() from the Vite app fails for downloads).
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://robertred.blog',
    'https://www.robertred.blog',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/docs', express.static(path.join(__dirname, 'docs'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
const authMiddleware      = require('./middleware/auth');
const notifyMiddleware    = require('./middleware/notifyMiddleware');
const notificationsRoutes = require('./routes/notifications');

app.use(notifyMiddleware);

const authRoutes       = require('./routes/auth');
const usersRoutes      = require('./routes/user');
const projectsRoutes   = require('./routes/projects');
const archRoutes       = require('./routes/arch');

// Public routes — no token needed
app.use('/api/auth', authRoutes);

// Protected routes — token required, expires 24h
app.use('/api/users',         authMiddleware, usersRoutes);
// Arch must be mounted BEFORE /api/projects to prevent /:id catching /arch/bulk
app.use('/api/projects', authMiddleware, archRoutes);
app.use('/api/projects',      authMiddleware, projectsRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running!',
    endpoints: {
      users: '/api/users',
      projects: '/api/projects'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});