// Auth routes – creator / business / athlete / fan signup & login
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { incrementCounter } = require('../middleware/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();
const SALT_ROUNDS = 10;

async function signupRole(req, res, role) {
  try {
    const { name, email, password, profile_slug } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required', code: 'VALIDATION_ERROR' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format', code: 'VALIDATION_ERROR' });

    const { data: existing } = await supabase.from('creator_accounts').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' });

    const slug = profile_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data: slugExists } = await supabase.from('creators').select('id').eq('profile_slug', slug).maybeSingle();
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: creator, error: creatorErr } = await supabase.from('creators')
      .insert({ name: name.trim(), role, bio: '', location: '', profile_slug: finalSlug, social_links: {}, is_active: true })
      .select('id').single();
    if (creatorErr) throw creatorErr;

    await supabase.from('creator_accounts').insert({ creator_id: creator.id, email: email.toLowerCase().trim(), password_hash: hash, is_approved: true });
    await supabase.from('audit_log').insert({ action_type: 'user.create', actor: 'system', target: `${role}:${creator.id}`, reason: 'Self-registration' });
    await supabase.from('moderation_queue').insert({ type: 'user', status: 'pending', title_or_name: name.trim(), submitted_by: email.toLowerCase().trim(), entity_id: creator.id });

    const token = jwt.sign({ id: creator.id, email: email.toLowerCase().trim(), role, creatorId: creator.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    incrementCounter('auth.success');
    res.status(201).json({ message: 'Account created successfully', token, user: { id: creator.id, name: name.trim(), email: email.toLowerCase().trim(), role, profile_slug: finalSlug } });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed', code: 'INTERNAL_ERROR' });
  }
}

async function loginRole(req, res, roleFilter) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_ERROR' });

    const { data: account } = await supabase.from('creator_accounts')
      .select('*, creators!creator_id(name, role, profile_slug, is_active, is_suspended, suspend_reason)')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const creator = account?.creators;
    if (!account || (roleFilter && creator?.role !== roleFilter)) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }
    if (creator?.is_suspended) {
      incrementCounter('auth.failure');
      return res.status(403).json({ error: 'Your account has been suspended' + (creator.suspend_reason ? `: ${creator.suspend_reason}` : ''), code: 'ACCOUNT_SUSPENDED' });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      incrementCounter('auth.failure');
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign({ id: account.creator_id, email: account.email, role: creator.role, creatorId: account.creator_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    incrementCounter('auth.success');
    res.json({ message: 'Login successful', token, user: { id: account.creator_id, name: creator.name, email: account.email, role: creator.role, profile_slug: creator.profile_slug } });
  } catch (err) {
    incrementCounter('auth.failure');
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', code: 'INTERNAL_ERROR' });
  }
}

router.post('/signup', (req, res) => signupRole(req, res, 'creator'));
router.post('/login', (req, res) => loginRole(req, res, null));
router.post('/business/signup', (req, res) => signupRole(req, res, 'business'));
router.post('/business/login', (req, res) => loginRole(req, res, 'business'));
router.post('/fan/signup', (req, res) => signupRole(req, res, 'fan'));
router.post('/fan/login', (req, res) => loginRole(req, res, 'fan'));
router.post('/athlete/signup', (req, res) => signupRole(req, res, 'athlete'));
router.post('/athlete/login', (req, res) => loginRole(req, res, 'athlete'));

// ── Forgot Password ──
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });

    const { data: account } = await supabase.from('creator_accounts').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (!account) return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from('password_resets').upsert({ email: email.toLowerCase().trim(), code, expires_at: expiresAt }, { onConflict: 'email' });
    await resend.emails.send({
      from: 'PLXYGROUND <onboarding@resend.dev>',
      to: email.toLowerCase().trim(),
      subject: 'Your password reset code',
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
    await supabase.from('audit_log').insert({ action_type: 'password.reset_requested', actor: email.toLowerCase().trim(), target: `email:${email}` });

    res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ── Reset Password ──
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password are required', code: 'VALIDATION_ERROR' });

    const { data: reset } = await supabase.from('password_resets').select('*').eq('email', email.toLowerCase().trim()).eq('code', code).maybeSingle();
    if (!reset || new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset code', code: 'INVALID_CODE' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await supabase.from('creator_accounts').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('email', email.toLowerCase().trim());
    await supabase.from('password_resets').delete().eq('email', email.toLowerCase().trim());
    await supabase.from('audit_log').insert({ action_type: 'password.reset_completed', actor: email.toLowerCase().trim(), target: `email:${email}` });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ── Delete Account (Apple App Store requirement) ──
router.delete('/account', authenticate, async (req, res) => {
  try {
    const creatorId = req.user.creatorId;
    await supabase.from('notifications').delete().eq('user_id', creatorId);
    await supabase.from('moderation_queue').delete().eq('submitted_by', req.user.email);
    await supabase.from('content').delete().eq('creator_id', creatorId);
    await supabase.from('opportunities').delete().eq('creator_id', creatorId);
    await supabase.from('audit_log').insert({ action_type: 'user.account.delete', actor: req.user.email, target: `creator:${creatorId}` });
    await supabase.from('creator_accounts').delete().eq('creator_id', creatorId);
    await supabase.from('creators').delete().eq('id', creatorId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
