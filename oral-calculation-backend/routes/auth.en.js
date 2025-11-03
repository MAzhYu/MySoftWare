const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User.mysql');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// helpers
const mapValidationMsg = (e) => {
  const f = e.path || e.param;
  switch (f) {
    case 'username': return 'Username must be 3-20 characters';
    case 'email': return 'Invalid email';
    case 'password': return 'Password must be at least 6 characters';
    case 'role': return "Role must be one of: student, parent, teacher";
    case 'childUsername': return 'childUsername is required';
    case 'relationship': return "relationship must be 'son' or 'daughter'";
    case 'parentUserId': return 'parentUserId is required';
    case 'correct': return 'correct must be a non-negative integer';
    case 'total': return 'total must be a positive integer';
    case 'practiceTime': return 'practiceTime must be a non-negative integer';
    default: return 'Invalid parameter';
  }
};
const sendValidationFailed = (res, errors) => {
  const mapped = errors.array().map(e => ({ ...e, msg: mapValidationMsg(e) }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: mapped });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      learningProgress: user.learningProgress,
      achievements: user.achievements
    }
  });
};

// register
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'parent', 'teacher'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    const { username, email, password, role, profile } = req.body;
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const user = await User.create({ username, email, password, role, profile });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// login
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        learningProgress: user.learningProgress,
        achievements: user.achievements,
        streak: user.streak,
        totalPracticeTime: user.totalPracticeTime,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// update profile
router.put('/profile', protect, [
  body('username').optional().isLength({ min: 3, max: 20 }),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    const updateFields = {}; ['username','email','profile'].forEach(f => { if (req.body[f] !== undefined) updateFields[f] = req.body[f]; });
    if (updateFields.email && updateFields.email !== req.user.email) updateFields.emailVerified = false;
    Object.assign(req.user, updateFields);
    await req.user.save();
    res.status(200).json({ success: true, message: 'Updated', user: { id: req.user.id, username: req.user.username, email: req.user.email, role: req.user.role, profile: req.user.profile, learningProgress: req.user.learningProgress } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// bind child
router.post('/bind-child', protect, authorize('parent'), [
  body('childUsername').notEmpty(),
  body('relationship').isIn(['son','daughter'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    const { childUsername, relationship } = req.body;
    const childUser = await User.findOne({ where: { username: childUsername, role: 'student' } });
    if (!childUser) return res.status(404).json({ success: false, message: 'Student account not found' });

    const relations = Array.isArray(req.user.familyRelations) ? req.user.familyRelations : [];
    if (relations.some(r => String(r.childUserId) === String(childUser.id))) return res.status(400).json({ success: false, message: 'Relation already exists' });

    relations.push({ childUserId: childUser.id, relationship, isVerified: false });
    req.user.familyRelations = relations;
    await req.user.save();
    res.status(200).json({ success: true, message: 'Binding created, waiting for student confirmation', pendingVerification: true });
  } catch (error) {
    console.error('Bind child error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// confirm parent
router.post('/confirm-parent', protect, authorize('student'), [ body('parentUserId').notEmpty() ], async (req, res) => {
  try {
    const { parentUserId } = req.body;
    const parentUser = await User.findByPk(parentUserId);
    if (!parentUser || parentUser.role !== 'parent') return res.status(404).json({ success: false, message: 'Parent account not found' });

    const relations = Array.isArray(parentUser.familyRelations) ? parentUser.familyRelations : [];
    const relation = relations.find(rel => String(rel.childUserId) === String(req.user.id));
    if (!relation) return res.status(404).json({ success: false, message: 'Relation not found' });

    relation.isVerified = true;
    parentUser.familyRelations = relations;
    await parentUser.save();
    res.status(200).json({ success: true, message: 'Confirmed' });
  } catch (error) {
    console.error('Confirm parent error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// children progress
router.get('/children-progress', protect, authorize('parent'), async (req, res) => {
  try {
    const parent = await User.findByPk(req.user.id);
    const relations = (parent.familyRelations || []).filter(r => r.isVerified);
    const childIds = relations.map(r => r.childUserId);
    if (childIds.length === 0) return res.status(200).json({ success: true, count: 0, data: [] });
    const children = await User.findAll({ attributes: ['id','username','profile','learningProgress','achievements','streak','totalPracticeTime'], where: { id: childIds } });
    const data = relations.map(r => ({ relationship: r.relationship, child: children.find(c => String(c.id) === String(r.childUserId)) }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Children progress error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// update progress
router.post('/update-progress', protect, [
  body('correct').isInt({ min: 0 }),
  body('total').isInt({ min: 1 }),
  body('practiceTime').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    const { correct, total, practiceTime } = req.body;
    await req.user.updateLearningProgress(correct, total, practiceTime);
    res.status(200).json({ success: true, message: 'Updated', progress: req.user.learningProgress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
