const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const GP = require('../models/GP');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, specialization } = req.body;

  try {
    const gpExists = await GP.findOne({ email });
    if (gpExists) return res.status(400).json({ message: 'GP already exists' });

    const gp = await GP.create({ name, email, password, specialization });

    if (gp) {
      res.status(201).json({
        token: generateToken(gp._id),
        user: { id: gp._id, name: gp.name, email: gp.email }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const gp = await GP.findOne({ email });
    if (gp && (await gp.matchPassword(password))) {
      res.json({
        token: generateToken(gp._id),
        user: { id: gp._id, name: gp.name, email: gp.email }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
