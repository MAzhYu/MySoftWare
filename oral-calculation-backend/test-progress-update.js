// 测试学习进度更新功能
// 运行方式: node test-progress-update.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProgressUpdate() {
  try {
    console.log('=== 学习进度更新测试 ===\n');

    // 1. 登录获取 token
    console.log('1. 登录测试账号...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✓ 登录成功\n');

    // 2. 查看当前学习进度
    console.log('2. 查看当前学习进度...');
    const meRes1 = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const beforeProgress = meRes1.data.user.learningProgress;
    console.log('当前学习进度:', {
      totalExercises: beforeProgress.totalExercises,
      correctAnswers: beforeProgress.correctAnswers,
      averageAccuracy: beforeProgress.averageAccuracy,
      totalPracticeTime: meRes1.data.user.totalPracticeTime
    });
    console.log('');

    // 3. 获取题目
    console.log('3. 获取10道题目...');
    const problemsRes = await axios.get(
      `${BASE_URL}/api/problems?type=mixed&difficulty=easy&count=10&grade=1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const problems = problemsRes.data.data;
    console.log(`✓ 获取到 ${problems.length} 道题目\n`);

    // 4. 模拟答题（答对8题，答错2题）
    console.log('4. 提交答案（10题，对8题）...');
    const submittedProblems = problems.map((p, index) => ({
      id: p.id,
      expression: p.expression,
      answer: p.answer,
      userAnswer: index < 8 ? p.answer : 'wrong_answer', // 前8题对，后2题错
      type: p.type,
      difficulty: p.difficulty,
      timeSpent: 10
    }));

    const submitRes = await axios.post(
      `${BASE_URL}/api/problems/submit`,
      {
        problems: submittedProblems,
        totalTime: 120, // 2分钟
        grade: 1,
        module: '加减训练'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✓ 提交成功');
    console.log('评分结果:', submitRes.data.summary);
    console.log('');

    // 5. 再次查看学习进度
    console.log('5. 查看更新后的学习进度...');
    const meRes2 = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const afterProgress = meRes2.data.user.learningProgress;
    console.log('更新后学习进度:', {
      totalExercises: afterProgress.totalExercises,
      correctAnswers: afterProgress.correctAnswers,
      averageAccuracy: afterProgress.averageAccuracy,
      totalPracticeTime: meRes2.data.user.totalPracticeTime
    });
    console.log('');

    // 6. 验证数据变化
    console.log('6. 验证数据变化...');
    const exercisesDiff = afterProgress.totalExercises - beforeProgress.totalExercises;
    const answersDiff = afterProgress.correctAnswers - beforeProgress.correctAnswers;
    const timeDiff = meRes2.data.user.totalPracticeTime - meRes1.data.user.totalPracticeTime;

    console.log(`练习总数增加: ${exercisesDiff} (期望: 10)`);
    console.log(`正确题数增加: ${answersDiff} (期望: 8)`);
    console.log(`练习时长增加: ${timeDiff}秒 (期望: 120)`);
    console.log(`当前正确率: ${afterProgress.averageAccuracy}%`);
    console.log('');

    // 验证结果
    if (exercisesDiff === 10 && answersDiff === 8 && timeDiff === 120) {
      console.log('✅ 测试通过！学习进度更新正常');
    } else {
      console.log('❌ 测试失败！学习进度未正确更新');
    }

  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testProgressUpdate();
