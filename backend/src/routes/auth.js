// Auth routes – creator signup/login, business signup/login
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { incrementCounter } = require('../middleware/logger');

const router = express.Router();
const SALT_ROUNDS = 10;

// ── Creator Signup ──
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, profile_slug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required', code: 'VALIDATION_ERROR' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format', code: 'VALIDATION_ERROR' });
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM creator_accounts WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' });
    }

    const slug = profile_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slugExists = db.prepare('SELECT id FROM creators WHERE profile_slug = ?').get(slug);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const creator = db.prepare(
      'INSERT INTO creators (name, role, bio, location, profile_slug, social_links, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name.trim(), 'creator', '', '', finalSlug, '{}', 1);

    db.prepare(
      'INSERT INTO creator_accounts (creator_id, email, password_hash, is_approved) VALUES (?, ?, ?, ?)'
    ).run(creator.lastInsertRowid, email.toLowerCase().trim(), hash, 1);

    // Audit
    db.prepare('INSERT INTO audit_log (action_type, actor, target, reason) VALUES (?, ?, ?, ?)')
      .run('user.create', 'system', `creator:${creator.lastInsertRowid}`, 'Self-registration');

    // Add to moderation queue
    db.prepare('INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id) VALUES (?, ?, ?, ?, ?)')
      .run('user', 'pending', name.trim(), email.toLowerCase().trim(), creator.lastInsertRowid);

    const token = jwt.sign(
      { id: creator.lastInsertRowid, email: email.toLowerCase().trim(), role: 'creator', creatorId: creator.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    incrementCounter('auth.success');
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: creator.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), role: 'creator', profile_slug: finalSlug },
    });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed', code: 'INTERNAL_ERROR' });
  }
});

// ── Creator Login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
    }

    const account = db.prepare(`
      SELECT ca.*, c.name, c.role, c.profile_slug, c.is_active, c.is_suspended, c.suspend_reason
      FROM creator_accounts ca
      JOIN creators c ON c.id = ca.creator_id
      WHERE ca.email = ?
    `).get(email.toLowerCase().trim());

    if (!account) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    // Check suspended
    if (account.is_suspended) {
      incrementCounter('auth.failure');
      return res.status(403).json({
        error: 'Your account has been suspended' + (account.suspend_reason ? `: ${account.suspend_reason}` : ''),
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
      { id: account.creator_id, email: account.email, role: account.role, creatorId: account.creator_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    incrementCounter('auth.success');
    res.json({
      message: 'Login successful',
      token,
      user: { id: account.creator_id, name: account.name, email: account.email, role: account.role, profile_slug: account.profile_slug },
    });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', code: 'INTERNAL_ERROR' });
  }
});

// ── Business Signup ──
router.post('/business/signup', async (req, res) => {
  try {
    const { name, email, password, profile_slug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required', code: 'VALIDATION_ERROR' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' });
    }

    const existing = db.prepare('SELECT id FROM creator_accounts WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' });
    }

    const slug = profile_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slugExists = db.prepare('SELECT id FROM creators WHERE profile_slug = ?').get(slug);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const creator = db.prepare(
      'INSERT INTO creators (name, role, bio, location, profile_slug, social_links, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name.trim(), 'business', '', '', finalSlug, '{}', 1);

    db.prepare(
      'INSERT INTO creator_accounts (creator_id, email, password_hash, is_approved) VALUES (?, ?, ?, ?)'
    ).run(creator.lastInsertRowid, email.toLowerCase().trim(), hash, 1);

    db.prepare('INSERT INTO audit_log (action_type, actor, target, reason) VALUES (?, ?, ?, ?)')
      .run('user.create', 'system', `business:${creator.lastInsertRowid}`, 'Business self-registration');

    db.prepare('INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id) VALUES (?, ?, ?, ?, ?)')
      .run('user', 'pending', name.trim(), email.toLowerCase().trim(), creator.lastInsertRowid);

    const token = jwt.sign(
      { id: creator.lastInsertRowid, email: email.toLowerCase().trim(), role: 'business', creatorId: creator.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    incrementCounter('auth.success');
    res.status(201).json({
      message: 'Business account created successfully',
      token,
      user: { id: creator.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), role: 'business', profile_slug: finalSlug },
    });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Business signup error:', err);
    res.status(500).json({ error: 'Registration failed', code: 'INTERNAL_ERROR' });
  }
});

// ── Business Login ──
router.post('/business/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });
    }

    const account = db.prepare(`
      SELECT ca.*, c.name, c.role, c.profile_slug, c.is_active, c.is_suspended, c.suspend_reason
      FROM creator_accounts ca
      JOIN creators c ON c.id = ca.creator_id
      WHERE ca.email = ? AND c.role = 'business'
    `).get(email.toLowerCase().trim());

    if (!account) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    if (account.is_suspended) {
      incrementCounter('auth.failure');
      return res.status(403).json({
        error: 'Your account has been suspended' + (account.suspend_reason ? `: ${account.suspend_reason}` : ''),
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
      { id: account.creator_id, email: account.email, role: 'business', creatorId: account.creator_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    incrementCounter('auth.success');
    res.json({
      message: 'Login successful',
      token,
      user: { id: account.creator_id, name: account.name, email: account.email, role: 'business', profile_slug: account.profile_slug },
    });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Business login error:', err);
    res.status(500).json({ error: 'Login failed', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
