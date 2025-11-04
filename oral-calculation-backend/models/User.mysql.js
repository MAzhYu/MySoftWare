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
  // Get current learning progress or initialize
  const lp = this.learningProgress || { 
    grade: '一年级', 
    currentLevel: '基础', 
    totalExercises: 0, 
    correctAnswers: 0, 
    averageAccuracy: 0, 
    lastPracticeDate: null 
  };
  
  // Update values
  lp.totalExercises = (lp.totalExercises || 0) + total;
  lp.correctAnswers = (lp.correctAnswers || 0) + correct;
  lp.averageAccuracy = parseFloat(
    ((lp.correctAnswers / Math.max(1, lp.totalExercises)) * 100).toFixed(2)
  );
  lp.lastPracticeDate = new Date();
  
  // Update practice time
  const newPracticeTime = (this.totalPracticeTime || 0) + (practiceTime || 0);
  
  // Use update method to ensure Sequelize tracks changes
  await this.update({
    learningProgress: lp,
    totalPracticeTime: newPracticeTime
  });
  
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
