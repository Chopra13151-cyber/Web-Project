// routes/index.js (excerpt)
const express = require('express');
const router = express.Router();

function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  // store returnTo if you want to redirect back after login
  return res.redirect('/auth/login');
}

// home page
router.get('/', (req, res) => res.render('index'));

// confirmation page
router.get('/confirmation', (req, res) => res.render('confirmation'));

// admin page (protected)
router.get('/admin', requireLogin, (req, res) => {
  res.render('admin', { user: req.session.user });
});

module.exports = router;
