const express = require('express');
const { body, validationResult } = require('express-validator');
const ProblemService = require('../services/ProblemService');
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
    const validTypes = ['addition', 'subtraction', 'multiplication', 'division', 'mixed', 'comparison', 'fill_blank'];
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
  body('problems.*.timeSpent').isNumeric().withMessage('timeSpent must be a number')
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

    const { problems: submittedProblems, totalTime = 0 } = req.body;

    // Score problems
    const results = submittedProblems.map(submitted => {
      // In production we should fetch original problem from DB/cache
      // For simplicity we trust client-submitted original problem fields here
      const isCorrect = problemService.validateAnswer(submitted, submitted.userAnswer);
      
      return {
        id: submitted.id,
        expression: submitted.expression,
        type: submitted.type,
        difficulty: submitted.difficulty,
        correctAnswer: submitted.answer,
        userAnswer: submitted.userAnswer,
        isCorrect: isCorrect,
        timeSpent: submitted.timeSpent || 0
      };
    });

    // Summary
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount * 100).toFixed(1) : 0;

    // Optional: update user progress via another API in real app
    const updatePayload = {
      correct: correctCount,
      total: totalCount,
      practiceTime: totalTime
    };

    res.status(200).json({
      success: true,
      message: 'Scored successfully',
      summary: {
        total: totalCount,
        correct: correctCount,
        accuracy: parseFloat(accuracy),
        totalTime: totalTime
      },
      details: results
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

module.exports = router;