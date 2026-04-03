const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Import Routes
const authRoutes = require('./routes/auth');
const screensRoutes = require('./routes/screens');
const phonesRoutes = require('./routes/phones');
const accessoriesRoutes = require('./routes/accessories');
const stickersRoutes = require('./routes/stickers');
const customersRoutes = require('./routes/customers');
const suppliersRoutes = require('./routes/suppliers');
const salesRoutes = require('./routes/sales');
const repairsRoutes = require('./routes/repairs');
const expensesRoutes = require('./routes/expenses');
const returnsRoutes = require('./routes/returns');
const installmentsRoutes = require('./routes/installments');
const dashboardRoutes = require('./routes/dashboard');
const backupRoutes = require('./routes/backup');
const usersRoutes = require('./routes/users');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/screens', screensRoutes);
app.use('/api/phones', phonesRoutes);
app.use('/api/accessories', accessoriesRoutes);
app.use('/api/stickers', stickersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/users', usersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // يستمع على جميع الـ interfaces للشبكة المحلية

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  // طباعة عناوين الشبكة المحلية
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach(name => {
    networkInterfaces[name].forEach(net => {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Network: http://${net.address}:${PORT}`);
      }
    });
  });
});
