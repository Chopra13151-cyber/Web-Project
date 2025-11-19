// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth'); // make sure this file exists (routes/auth.js)

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse body (express built-ins)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Quick health-check route
app.get('/ping', (req, res) => res.send('pong'));

// connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hungerhub';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// SESSION configuration (uses MongoDB to persist sessions)
const SESSION_SECRET = process.env.SESSION_SECRET || 'please_change_this_secret';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    httpOnly: true,
    // secure: true, // enable when using HTTPS
    maxAge: 14 * 24 * 60 * 60 * 1000
  }
}));

// Make session user available to all EJS templates as `currentUser`
app.use((req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  next();
});

// mount routes
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter); // authentication routes: /auth/login, /auth/register, /auth/logout

// 404 handler (renders views/404.ejs if present, otherwise sends text)
app.use((req, res) => {
  // render 404 page if exists otherwise send a plain message
  try {
    return res.status(404).render('404', { url: req.originalUrl });
  } catch (e) {
    return res.status(404).send(`Not Found: ${req.originalUrl}`);
  }
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running at http://localhost:${PORT}`));
