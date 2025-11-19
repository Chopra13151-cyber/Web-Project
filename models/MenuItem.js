// models/MenuItem.js
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: String, default: '' },
  link: { type: String, default: '#' },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
