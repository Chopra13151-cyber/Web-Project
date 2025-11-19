// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null, error: null });
});

// POST register
router.post('/register', async (req, res) => {
  try {
    const { name = '', email = '', password = '' } = req.body;
    if (!name.trim() || !email.trim() || !password) {
      return res.status(400).render('register', { error: 'All fields required', user: null });
    }

    // check existing
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).render('register', { error: 'Email already registered', user: null });
    }

    // hash password
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
    });
    await user.save();

    // put user in session (minimal info)
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    return res.redirect('/admin'); // or wherever suitable
  } catch (err) {
    console.error('POST /auth/register error:', err);
    return res.status(500).render('register', { error: 'Server error', user: null });
  }
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { user: req.session.user || null, error: null });
});

// POST login
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
    if (!email.trim() || !password) {
      return res.status(400).render('login', { error: 'Email and password required', user: null });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).render('login', { error: 'Invalid credentials', user: null });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).render('login', { error: 'Invalid credentials', user: null });
    }

    // login success: store minimal info in session
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    // Redirect to admin or original page
    return res.redirect('/admin');
  } catch (err) {
    console.error('POST /auth/login error:', err);
    return res.status(500).render('login', { error: 'Server error', user: null });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.warn('Session destroy error:', err);
    res.redirect('/');
  });
});

module.exports = router;
