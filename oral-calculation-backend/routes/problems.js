const express = require('express');
const { body, validationResult } = require('express-validator');
const ProblemService = require('../services/ProblemService');
const WrongProblem = require('../models/WrongProblem.mysql');
const User = require('../models/User.mysql');
const { protect } = require('../middleware/auth');

const router = express.Router();
const problemService = new ProblemService();

// Get problems list
router.get('/', [
  protect,
  // ��ѯ������֤�ڿ������д���
], async (req, res) => {
  try {
    const { 
      type = 'mixed', 
      difficulty = 'easy', 
      count = 10,
      grade 
    } = req.query;

  // Infer difficulty by grade if not provided
    let actualDifficulty = difficulty;
    if (grade && !difficulty) {
      const gradeNum = parseInt(grade);
      if (gradeNum <= 2) actualDifficulty = 'easy';
      else if (gradeNum <= 4) actualDifficulty = 'medium';
      else actualDifficulty = 'hard';
    }

    // Validate inputs
    const validTypes = [
      'addition', 'subtraction', 'multiplication', 'division', 'mixed', 'comparison', 'fill_blank',
      // 一二年级题型（ProblemService 支持）
      'addition_10', 'subtraction_10', 'addition_20_carry', 'subtraction_20_borrow', 'mixed_100_add_sub', 'money_conversion',
      'multiplication_9x9', 'division_9x9', 'mixed_mul_add', 'mixed_consecutive_mul', 'division_with_remainder', 'time_conversion',
      // 三四年级及其他新增题型（ProblemService 第二批新增）
      'add_sub_3digit', 'multiplication_2digit', 'perimeter_calc', 'area_calc', 'comparison_100', 'weight_conversion', 'time_duration', 'division_with_remainder_large',
      'decimal_add_sub', 'decimal_rounding', 'mixed_ops_2digit', 'mixed_ops_parenthesis', 'associative_law', 'distributive_law', 'advanced_comparison', 'number_rounding_unit'
    ];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid problem type. Allowed: ${validTypes.join(', ')}`
      });
    }

    if (!validDifficulties.includes(actualDifficulty)) {
      return res.status(400).json({
        success: false,
        message: `Invalid difficulty. Allowed: ${validDifficulties.join(', ')}`
      });
    }

    const problemCount = Math.min(parseInt(count), 50); // cap at 50

    if (isNaN(problemCount) || problemCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Count must be an integer greater than 0'
      });
    }

    // Generate problems
    const problems = problemService.generateProblems(type, actualDifficulty, problemCount);

    res.status(200).json({
      success: true,
      count: problems.length,
      type: type,
      difficulty: actualDifficulty,
      data: problems
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error, failed to get problems'
    });
  }
});

// Submit answers and score
router.post('/submit', [
  protect,
  body('problems').isArray().withMessage('problems must be an array'),
  body('problems.*.id').notEmpty().withMessage('problem id is required'),
  body('problems.*.userAnswer').notEmpty().withMessage('userAnswer is required'),
  body('problems.*.timeSpent').isNumeric().withMessage('timeSpent must be a number'),
  body('grade').optional().isInt({ min: 1, max: 6 }),
  body('module').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { problems: submittedProblems, totalTime = 0, grade, module } = req.body;
    const userId = req.user.id;

    // Score problems
    const results = submittedProblems.map(submitted => {
      const isCorrect = problemService.validateAnswer(submitted, submitted.userAnswer);

      return {
        id: submitted.id,
        expression: submitted.expression,
        type: submitted.type,
        difficulty: submitted.difficulty,
        correctAnswer: submitted.answer,
        // 如果服务器端题目包含 remainder，也返回出来，便于前端显示
        remainder: submitted.remainder !== undefined ? submitted.remainder : undefined,
        userAnswer: submitted.userAnswer,
        isCorrect: isCorrect,
        timeSpent: submitted.timeSpent || 0
      };
    });

    // Save wrong problems to database
    const wrongProblems = results.filter(r => !r.isCorrect);
    
    if (wrongProblems.length > 0) {
      for (const problem of wrongProblems) {
        try {
          // Diagnostic logging to help trace why some wrong problems may not be persisted
          console.log('Saving wrong problem candidate:', {
            userId,
            expression: problem.expression,
            type: problem.type,
            difficulty: problem.difficulty,
            userAnswer: problem.userAnswer,
            correctAnswer: problem.correctAnswer,
            remainder: problem.remainder
          });

          // Normalize answers to strings for DB fields (avoid saving objects like {quotient,remainder})
          function formatAnswerForSave(ans, rem) {
            if (ans === undefined || ans === null) return '';
            // If ans is an object (e.g. {quotient, remainder}) convert to readable string
            if (typeof ans === 'object') {
              const q = ans.quotient ?? ans.q ?? ans.quotientAnswer ?? null;
              const r = ans.remainder ?? ans.r ?? ans.rem ?? null;
              if (q !== null && r !== null && r !== undefined) {
                return `${q} 余 ${r}`;
              }
              if (q !== null) return `${q}`;
              return JSON.stringify(ans);
            }
            // If we have a separate remainder value, include it
            if (rem !== undefined && rem !== null) {
              return `${ans} 余 ${rem}`;
            }
            return String(ans);
          }

          const saveUserAnswer = formatAnswerForSave(problem.userAnswer, problem.remainder);
          const saveCorrectAnswer = formatAnswerForSave(problem.correctAnswer, problem.remainder);
          // Check if this problem already exists for this user
          const existing = await WrongProblem.findOne({
            where: {
              userId: userId,
              expression: problem.expression,
              isMastered: false
            }
          });

          if (existing) {
            // Update wrong count and last attempt date, update the userAnswer string
            await existing.update({
              wrongCount: existing.wrongCount + 1,
              lastAttemptDate: new Date(),
              userAnswer: saveUserAnswer,
              correctAnswer: saveCorrectAnswer
            });
          } else {
            // Create new wrong problem record with normalized answer strings
            await WrongProblem.create({
              userId: userId,
              expression: problem.expression,
              type: problem.type,
              difficulty: problem.difficulty,
              correctAnswer: saveCorrectAnswer,
              userAnswer: saveUserAnswer,
              grade: grade,
              module: module,
              wrongCount: 1,
              isMastered: false,
              lastAttemptDate: new Date()
            });
          }
        } catch (dbError) {
          console.error('Error saving wrong problem:', dbError, { problem });
          // Continue with other problems even if one fails
        }
      }
    }

    // Summary
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount * 100).toFixed(1) : 0;

    // Update user learning progress
    try {
      // Reload user from database to ensure we have the full instance with methods
      const user = await User.findByPk(req.user.id);
      if (user) {
        await user.updateLearningProgress(correctCount, totalCount, totalTime);
        // Fetch persisted values to be extra sure
        const fresh = await User.findByPk(user.id, { attributes: ['id','learningProgress','totalPracticeTime'] });
        console.log('Learning progress updated successfully:', {
          userId: fresh.id,
          totalExercises: fresh.learningProgress?.totalExercises,
          correctAnswers: fresh.learningProgress?.correctAnswers,
          averageAccuracy: fresh.learningProgress?.averageAccuracy
        });
        req.updatedProgress = fresh; // stash for response
      }
    } catch (progressError) {
      console.error('Error updating learning progress:', progressError);
      // Continue even if progress update fails
    }

    res.status(200).json({
      success: true,
      message: 'Scored successfully',
      summary: {
        total: totalCount,
        correct: correctCount,
        wrong: wrongProblems.length,
        accuracy: parseFloat(accuracy),
        totalTime: totalTime
      },
      details: results,
      currentProgress: req.updatedProgress ? req.updatedProgress.learningProgress : undefined,
      totalPracticeTime: req.updatedProgress ? req.updatedProgress.totalPracticeTime : undefined
    });
  } catch (error) {
    console.error('Submit problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error, failed to submit problems'
    });
  }
});

// Get problem type and difficulty options
router.get('/options', protect, (req, res) => {
  try {
    const types = [
      { value: 'addition', label: 'Addition', description: 'Basic addition up to grade level' },
      { value: 'subtraction', label: 'Subtraction', description: 'Basic subtraction up to grade level' },
      { value: 'multiplication', label: 'Multiplication', description: 'Multiplication facts and more' },
      { value: 'division', label: 'Division', description: 'Division facts and more' },
      { value: 'mixed', label: 'Mixed', description: 'Mixed operations' },
      { value: 'comparison', label: 'Comparison', description: 'Compare numbers >, <, =' },
      { value: 'fill_blank', label: 'Fill in the blank', description: 'Fill missing number/operator' }
    ];

    const difficulties = [
      { value: 'easy', label: 'Easy', description: 'Suitable for grades 1-2', grade: '1-2' },
      { value: 'medium', label: 'Medium', description: 'Suitable for grades 3-4', grade: '3-4' },
      { value: 'hard', label: 'Hard', description: 'Suitable for grades 5-6', grade: '5-6' }
    ];

    res.status(200).json({
      success: true,
      data: {
        types,
        difficulties
      }
    });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error'
    });
  }
});

// Get grade-based recommendation
router.get('/recommendation/:grade', protect, (req, res) => {
  try {
    const { grade } = req.params;
    const gradeNum = parseInt(grade);

    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be an integer between 1 and 6'
      });
    }

    let recommendation;
    
    if (gradeNum <= 2) {
      recommendation = {
        difficulty: 'easy',
        recommendedTypes: ['addition', 'subtraction', 'comparison'],
        description: 'Grades 1-2: recommend addition/subtraction within 20 and comparisons'
      };
    } else if (gradeNum <= 4) {
      recommendation = {
        difficulty: 'medium',
        recommendedTypes: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
        description: 'Grades 3-4: recommend operations within 100, intro to mult/div, simple mixed'
      };
    } else {
      recommendation = {
        difficulty: 'hard',
        recommendedTypes: ['multiplication', 'division', 'mixed', 'fill_blank'],
        description: 'Grades 5-6: recommend mult/div with larger numbers, multi-step mixed, blanks'
      };
    }

    res.status(200).json({
      success: true,
      grade: gradeNum,
      recommendation
    });
  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error'
    });
  }
});

// Get user's wrong problems (错题集)
router.get('/wrong', protect, async (req, res) => {
  try {
    const { 
      type,
      difficulty,
      isMastered = false,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {
      userId: req.user.id,
      isMastered: isMastered === 'true'
    };

    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const wrongProblems = await WrongProblem.findAll({
      where,
      order: [['lastAttemptDate', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset)
    });

    const total = await WrongProblem.count({ where });

    res.status(200).json({
      success: true,
      count: wrongProblems.length,
      total: total,
      data: wrongProblems
    });
  } catch (error) {
    console.error('Get wrong problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error, failed to get wrong problems'
    });
  }
});

// Mark wrong problem as mastered
router.put('/wrong/:id/master', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const wrongProblem = await WrongProblem.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!wrongProblem) {
      return res.status(404).json({
        success: false,
        message: 'Wrong problem not found'
      });
    }

    await wrongProblem.update({ isMastered: true });

    res.status(200).json({
      success: true,
      message: 'Marked as mastered',
      data: wrongProblem
    });
  } catch (error) {
    console.error('Update wrong problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error'
    });
  }
});

// Delete wrong problem
router.delete('/wrong/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const wrongProblem = await WrongProblem.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!wrongProblem) {
      return res.status(404).json({
        success: false,
        message: 'Wrong problem not found'
      });
    }

    await wrongProblem.destroy();

    res.status(200).json({
      success: true,
      message: 'Wrong problem deleted'
    });
  } catch (error) {
    console.error('Delete wrong problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error'
    });
  }
});

module.exports = router;