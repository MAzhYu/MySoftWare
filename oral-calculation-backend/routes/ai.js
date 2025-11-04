const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const AIService = require('../services/AIService');

const router = express.Router();
const ai = new AIService();

function sendValidationFailed(res, errors) {
  return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
}

// health/config status
router.get('/status', protect, (req, res) => {
  res.status(200).json({
    success: true,
    provider: process.env.AI_PROVIDER || 'openai',
    configured: ai.isConfigured()
  });
});

// Generic chat endpoint
router.post('/chat', protect, [
  body('messages').optional().isArray(),
  body('prompt').optional().isString(),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('maxTokens').optional().isInt({ min: 1, max: 4096 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    if (!ai.isConfigured()) {
      return res.status(501).json({ success: false, message: 'AI is not configured. Please set environment variables.' });
    }

    const { messages, prompt, temperature, maxTokens, model } = req.body;
    let msgs = messages;
    if ((!msgs || msgs.length === 0) && prompt) {
      msgs = [{ role: 'user', content: String(prompt) }];
    }

    if (!msgs || msgs.length === 0) {
      return res.status(400).json({ success: false, message: 'messages or prompt is required' });
    }

    // Simple clamp on array length
    if (msgs.length > 20) msgs = msgs.slice(-20);

    const reply = await ai.chat(msgs, { temperature, maxTokens, model });

    res.status(200).json({
      success: true,
      data: {
        role: reply.role,
        content: reply.content,
        usage: reply.usage,
        provider: reply.provider,
        model: reply.model
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: error.message || 'AI service error' });
  }
});

// Math explanation helper
router.post('/explain', protect, [
  body('expression').isString(),
  body('correctAnswer').exists(),
  body('userAnswer').exists(),
  body('grade').optional().isInt({ min: 1, max: 6 }),
  body('language').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationFailed(res, errors);

    if (!ai.isConfigured()) {
      return res.status(501).json({ success: false, message: 'AI is not configured. Please set environment variables.' });
    }

    const { expression, correctAnswer, userAnswer, grade = 1, language = 'zh' } = req.body;

    const systemPrompt = language.startsWith('zh')
      ? '你是一个小学生口算辅导老师。请使用 Markdown 输出，语言简洁友好，适合小学生理解。对于加减乘除题目，优先使用“竖式计算”的形式按步骤讲解（用等宽字体/代码块展示竖式，保证对齐），并指出学生错因与改正建议。最后给出1-2个相似练习题。'
      : 'You are an elementary math tutor. Answer in Markdown. Use step-by-step explanation with vertical arithmetic layout (in monospaced code blocks) for +, -, ×, ÷. Point out the mistake and how to fix it, then provide 1-2 practice problems.';

    const userPrompt = language.startsWith('zh')
      ? `年级: ${grade}\n题目: ${expression}\n学生答案: ${userAnswer}\n正确答案: ${correctAnswer}\n请按以下格式回答：\n\n## 题目回顾\n写出题目与答案\n\n## 解题步骤（竖式演示）\n使用代码块展示竖式，如：\n\n\u0060\u0060\u0060\n  36\n+ 27\n----\n  63\n\u0060\u0060\u0060\n\n逐步说明每一步的进位/借位/对齐逻辑。\n\n## 错因分析\n指出学生错误的原因。\n\n## 改正建议\n给出易懂的建议（最多3条）。\n\n## 巩固练习\n给出1-2道相似题，并给出答案（不需要过程）。`
      : `Grade: ${grade}\nProblem: ${expression}\nStudent Answer: ${userAnswer}\nCorrect Answer: ${correctAnswer}\nFollow this structure in Markdown:\n\n## Problem\nState the problem and correct answer.\n\n## Step-by-step (Vertical layout)\nShow vertical arithmetic in a code block, e.g.:\n\n\u0060\u0060\u0060\n  36\n+ 27\n----\n  63\n\u0060\u0060\u0060\n\nExplain carry/borrow clearly.\n\n## Error Analysis\nWhy the student was wrong.\n\n## Tips\nUp to 3 short suggestions.\n\n## Practice\nProvide 1-2 similar problems with answers.`;

    const msgs = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const reply = await ai.chat(msgs, { temperature: 0.2, maxTokens: 600 });

    res.status(200).json({ success: true, explanation: reply.content });
  } catch (error) {
    console.error('AI explain error:', error);
    res.status(500).json({ success: false, message: error.message || 'AI service error' });
  }
});

module.exports = router;
