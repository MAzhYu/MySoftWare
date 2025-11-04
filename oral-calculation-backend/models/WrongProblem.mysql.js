const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.mysql');

const WrongProblem = sequelize.define('WrongProblem', {
  id: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    allowNull: false,
    comment: '用户ID'
  },
  expression: { 
    type: DataTypes.STRING(200), 
    allowNull: false,
    comment: '题目表达式'
  },
  type: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    comment: '题目类型'
  },
  difficulty: { 
    type: DataTypes.STRING(20), 
    allowNull: false,
    comment: '难度等级'
  },
  correctAnswer: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
    comment: '正确答案'
  },
  userAnswer: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
    comment: '用户答案'
  },
  grade: { 
    type: DataTypes.INTEGER.UNSIGNED,
    comment: '年级（1-6）'
  },
  module: { 
    type: DataTypes.STRING(50),
    comment: '学习模块'
  },
  wrongCount: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    defaultValue: 1,
    comment: '错误次数'
  },
  isMastered: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    comment: '是否已掌握'
  },
  lastAttemptDate: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW,
    comment: '最后尝试日期'
  }
}, { 
  tableName: 'wrong_problems', 
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'isMastered']
    },
    {
      fields: ['userId', 'type']
    }
  ]
});

// 关联用户模型
WrongProblem.associate = (models) => {
  WrongProblem.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = WrongProblem;
