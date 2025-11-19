// routes/api.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// DB model (make sure models/MenuItem.js exists)
const MenuItem = require('../models/MenuItem');

// TEMP logger to confirm hits
router.use((req, res, next) => {
  console.log('[API] incoming', req.method, req.originalUrl);
  next();
});

/**
 * GET /api/menu
 * Try DB first. If DB empty or error, fallback to public/data/mydata.json
 */
router.get('/menu', async (req, res) => {
  try {
    // Try DB first
    let itemsFromDb = [];
    try {
      itemsFromDb = await MenuItem.find().sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      console.warn('[API] DB read error (continuing to fallback):', dbErr.message);
    }

    if (itemsFromDb && itemsFromDb.length > 0) {
      return res.json(itemsFromDb);
    }

    // Fallback to JSON file
    const jsonPath = path.join(__dirname, '..', 'public', 'data', 'mydata.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn('mydata.json not found at', jsonPath);
      return res.json([]); // return empty array instead of 404 so frontend can handle it gracefully
    }
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    const items = data.menuItems || data;
    return res.json(items);
  } catch (err) {
    console.error('GET /api/menu error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/menu
 * Create and save a new MenuItem into MongoDB
 */
router.post('/menu', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || String(body.name).trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const payload = {
      name: String(body.name).trim(),
      image: body.image || '',
      price: body.price || '',
      link: body.link || '#',
      description: body.description || '',
      category: body.category || 'general'
    };

    const item = new MenuItem(payload);
    await item.save();

    console.log('[API] created menu item:', item._id);
    return res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/menu error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/menu/:id
 * Update an existing menu item and return the updated document
 */
router.put('/menu/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    console.log('[API] PUT payload:', id, body);

    const updated = await MenuItem.findByIdAndUpdate(
      id,
      {
        name: body.name,
        image: body.image,
        price: body.price,
        link: body.link,
        description: body.description,
        category: body.category
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('[API] PUT not found id=', id);
      return res.status(404).json({ error: 'Not found' });
    }

    console.log('[API] updated id=', updated._id);
    return res.json(updated);
  } catch (err) {
    console.error('PUT /api/menu error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
router.delete('/menu/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) {
      console.warn('[API] DELETE not found id=', id);
      return res.status(404).json({ error: 'Not found' });
    }
    console.log('[API] deleted id=', id);
    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/menu error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Optional: GET /api/seed-menu
 * One-time use: seeds DB from public/data/mydata.json (deletes existing menuitems first)
 * Call it once, then you can remove or disable this route.
 */
router.get('/seed-menu', async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, '..', 'public', 'data', 'mydata.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'mydata.json not found' });
    }

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    const items = data.menuItems || data;

    // clear and insert
    await MenuItem.deleteMany({});
    const inserted = await MenuItem.insertMany(items);

    console.log('[API] seeded menu items count=', inserted.length);
    return res.json({ inserted: inserted.length });
  } catch (err) {
    console.error('GET /api/seed-menu error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
