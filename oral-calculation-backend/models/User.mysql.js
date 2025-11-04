const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database.mysql');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(200), allowNull: false },
  role: { type: DataTypes.ENUM('student', 'parent', 'teacher', 'admin'), defaultValue: 'student' },
  profile: { type: DataTypes.JSON, defaultValue: {} },
  familyRelations: { type: DataTypes.JSON, defaultValue: [] },
  learningProgress: { type: DataTypes.JSON, defaultValue: { grade: '一年级', currentLevel: '基础', totalExercises: 0, correctAnswers: 0, averageAccuracy: 0, lastPracticeDate: null } },
  achievements: { type: DataTypes.JSON, defaultValue: [] },
  streak: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  totalPracticeTime: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'users', timestamps: true });

User.beforeSave(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.updateLearningProgress = async function(correct, total, practiceTime) {
  // Get current learning progress or initialize with defaults
  const prev = this.get('learningProgress') || {
    grade: '一年级',
    currentLevel: '基础',
    totalExercises: 0,
    correctAnswers: 0,
    averageAccuracy: 0,
    lastPracticeDate: null
  };

  // Build a fresh object to avoid in-place mutation issues with JSON columns
  const updated = {
    ...prev,
    totalExercises: (prev.totalExercises || 0) + (total || 0),
    correctAnswers: (prev.correctAnswers || 0) + (correct || 0),
  };
  updated.averageAccuracy = parseFloat(
    (((updated.correctAnswers || 0) / Math.max(1, updated.totalExercises || 0)) * 100).toFixed(2)
  );
  updated.lastPracticeDate = new Date();

  // Update fields on instance and force change detection for JSON
  this.set('learningProgress', updated);
  this.changed('learningProgress', true);
  this.set('totalPracticeTime', (this.totalPracticeTime || 0) + (practiceTime || 0));

  // Persist only the necessary fields and reload to ensure values reflect DB state
  await this.save({ fields: ['learningProgress', 'totalPracticeTime'] });
  await this.reload({ attributes: ['id', 'learningProgress', 'totalPracticeTime'] });

  return this;
};

User.prototype.addAchievement = async function(achievement) {
  const list = Array.isArray(this.achievements) ? this.achievements : [];
  if (!list.some(a => a.name === achievement.name)) {
    list.push({ ...achievement, earnedAt: achievement.earnedAt || new Date() });
    this.achievements = list;
    await this.save();
  }
  return this;
};

module.exports = User;
