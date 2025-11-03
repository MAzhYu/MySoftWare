class ProblemService {
  constructor() {
    // Use display-friendly operators for students; computation normalizes later
    this.operators = ['+', '-', '×', '÷'];
  }

  // ����ָ�����ͺ��Ѷȵ���Ŀ
  generateProblems(type, difficulty, count = 10) {
    const problems = [];
    
    for (let i = 0; i < count; i++) {
      let problem;
      
      switch (type) {
        case 'addition':
          problem = this.generateAddition(difficulty);
          break;
        case 'subtraction':
          problem = this.generateSubtraction(difficulty);
          break;
        case 'multiplication':
          problem = this.generateMultiplication(difficulty);
          break;
        case 'division':
          problem = this.generateDivision(difficulty);
          break;
        case 'mixed':
          problem = this.generateMixedOperation(difficulty);
          break;
        case 'comparison':
          problem = this.generateComparison(difficulty);
          break;
        case 'fill_blank':
          problem = this.generateFillBlank(difficulty);
          break;
        default:
          problem = this.generateMixedOperation(difficulty);
      }
      
      problems.push({
        id: this.generateId(),
        ...problem,
        userAnswer: null,
        isCorrect: null,
        timeSpent: 0
      });
    }
    
    return problems;
  }

  // ���ɼӷ���Ŀ
  generateAddition(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': // 1-2�꼶��20���ڼӷ�
        a = this.getRandomInt(1, 20);
        b = this.getRandomInt(1, 20 - a);
        result = a + b;
        break;
      case 'medium': // 3-4�꼶��100���ڼӷ�
        a = this.getRandomInt(10, 100);
        b = this.getRandomInt(10, 100);
        result = a + b;
        break;
      case 'hard': // 5-6�꼶��1000���ڼӷ������ܽ�λ
        a = this.getRandomInt(100, 1000);
        b = this.getRandomInt(100, 1000);
        result = a + b;
        break;
      default:
        a = this.getRandomInt(1, 20);
        b = this.getRandomInt(1, 20);
        result = a + b;
    }
    
    return {
      type: 'addition',
      difficulty: difficulty,
      expression: `${a} + ${b}`,
      answer: result,
      options: this.generateOptions(result, difficulty)
    };
  }

  // ���ɼ�����Ŀ
  generateSubtraction(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': // 1-2�꼶��20���ڼ����������Ϊ��
        a = this.getRandomInt(10, 20);
        b = this.getRandomInt(1, a);
        result = a - b;
        break;
      case 'medium': // 3-4�꼶��100���ڼ���
        a = this.getRandomInt(50, 100);
        b = this.getRandomInt(1, 50);
        result = a - b;
        break;
      case 'hard': // 5-6�꼶��1000���ڼ��������ܽ�λ
        a = this.getRandomInt(500, 1000);
        b = this.getRandomInt(100, 500);
        result = a - b;
        break;
      default:
        a = this.getRandomInt(10, 20);
        b = this.getRandomInt(1, 10);
        result = a - b;
    }
    
    return {
      type: 'subtraction',
      difficulty: difficulty,
      expression: `${a} - ${b}`,
      answer: result,
      options: this.generateOptions(result, difficulty)
    };
  }

  // ���ɳ˷���Ŀ
  generateMultiplication(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': // 2-3�꼶�����ڳ˷�
        a = this.getRandomInt(1, 9);
        b = this.getRandomInt(1, 9);
        result = a * b;
        break;
      case 'medium': // 3-4�꼶����λ����һλ��
        a = this.getRandomInt(10, 99);
        b = this.getRandomInt(2, 9);
        result = a * b;
        break;
      case 'hard': // 5-6�꼶����λ������λ��
        a = this.getRandomInt(10, 99);
        b = this.getRandomInt(10, 99);
        result = a * b;
        break;
      default:
        a = this.getRandomInt(1, 9);
        b = this.getRandomInt(1, 9);
        result = a * b;
    }
    
    return {
      type: 'multiplication',
      difficulty: difficulty,
      expression: `${a} × ${b}`,
      answer: result,
      options: this.generateOptions(result, difficulty)
    };
  }

  // ���ɳ�����Ŀ
  generateDivision(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': // 2-3�꼶�����ڳ���
        b = this.getRandomInt(1, 9);
        result = this.getRandomInt(1, 9);
        a = b * result;
        break;
      case 'medium': // 3-4�꼶������������
        b = this.getRandomInt(2, 9);
        result = this.getRandomInt(5, 20);
        const remainder = this.getRandomInt(1, b - 1);
        a = b * result + remainder;
        return {
          type: 'division',
          difficulty: difficulty,
          expression: `${a} ÷ ${b}`,
          answer: result,
          remainder: remainder,
          options: this.generateOptions(result, difficulty)
        };
      case 'hard': // 5-6�꼶����λ����һλ��
        b = this.getRandomInt(2, 9);
        result = this.getRandomInt(10, 99);
        a = b * result;
        break;
      default:
        b = this.getRandomInt(1, 9);
        result = this.getRandomInt(1, 9);
        a = b * result;
    }
    
    return {
      type: 'division',
      difficulty: difficulty,
      expression: `${a} ÷ ${b}`,
      answer: result,
      options: this.generateOptions(result, difficulty)
    };
  }

  // ���ɻ��������Ŀ
  generateMixedOperation(difficulty) {
    let a, b, c, operator1, operator2, expression, result;
    
    switch (difficulty) {
      case 'easy': // �Ӽ����
        a = this.getRandomInt(1, 20);
        b = this.getRandomInt(1, 20);
        c = this.getRandomInt(1, 20);
        operator1 = this.getRandomOperator(['+', '-']);
        operator2 = this.getRandomOperator(['+', '-']);
        
        expression = `${a} ${operator1} ${b} ${operator2} ${c}`;
        result = this.calculateExpression(expression);
        break;
        
      case 'medium': // multiplication/division
        a = this.getRandomInt(2, 9);
        b = this.getRandomInt(2, 9);
        c = this.getRandomInt(2, 9);
        operator1 = this.getRandomOperator(['×', '÷']);
        operator2 = this.getRandomOperator(['×', '÷']);
        
        // Ensure divisibility
        if (operator1 === '÷') {
          a = b * this.getRandomInt(2, 5);
        }
        if (operator2 === '÷') {
          if (operator1 === '÷') {
            c = this.getRandomInt(2, 5);
          } else {
            const temp = this.calculateExpression(`${a} ${operator1} ${b}`);
            c = this.getRandomInt(2, 5);
            a = temp * c;
          }
        }
        
        expression = `${a} ${operator1} ${b} ${operator2} ${c}`;
        result = this.calculateExpression(expression);
        break;
        
      case 'hard': // parentheses with multiplication
        const num1 = this.getRandomInt(10, 50);
        const num2 = this.getRandomInt(2, 9);
        const num3 = this.getRandomInt(10, 50);
        const num4 = this.getRandomInt(2, 9);
        
        expression = `(${num1} + ${num2}) × (${num3} - ${num4})`;
        result = (num1 + num2) * (num3 - num4);
        break;
        
      default:
        a = this.getRandomInt(1, 10);
        b = this.getRandomInt(1, 10);
        c = this.getRandomInt(1, 10);
        expression = `${a} + ${b} + ${c}`;
        result = a + b + c;
    }
    
    return {
      type: 'mixed',
      difficulty: difficulty,
      expression: expression,
      answer: result,
      options: this.generateOptions(result, difficulty)
    };
  }

  // ���ɱȽ���Ŀ��>��<��=��
  generateComparison(difficulty) {
    let left, right, operator, answer;
    
    const operators = ['>', '<', '='];
    
    switch (difficulty) {
      case 'easy':
        left = this.getRandomInt(1, 20);
        right = this.getRandomInt(1, 20);
        break;
      case 'medium':
        left = this.calculateExpression(`${this.getRandomInt(10, 50)} + ${this.getRandomInt(10, 50)}`);
        right = this.calculateExpression(`${this.getRandomInt(10, 50)} + ${this.getRandomInt(10, 50)}`);
        break;
      case 'hard':
        left = this.calculateExpression(
          `${this.getRandomInt(10, 30)} × ${this.getRandomInt(2, 5)} + ${this.getRandomInt(1, 20)}`
        );
        right = this.calculateExpression(
          `${this.getRandomInt(10, 30)} + ${this.getRandomInt(2, 5)} × ${this.getRandomInt(1, 20)}`
        );
        break;
      default:
        left = this.getRandomInt(1, 10);
        right = this.getRandomInt(1, 10);
    }
    
    // ��������ȽϷ��ţ���ȷ���߼���ȷ
    if (left > right) {
      operator = '>';
      answer = '>';
    } else if (left < right) {
      operator = '<';
      answer = '<';
    } else {
      operator = '=';
      answer = '=';
    }
    
    return {
      type: 'comparison',
      difficulty: difficulty,
      expression: `${left} ? ${right}`,
      answer: answer,
      options: ['>', '<', '=']
    };
  }

  // ���������
  generateFillBlank(difficulty) {
    let expression, answer, blankPosition;
    
    switch (difficulty) {
      case 'easy':
        const a = this.getRandomInt(1, 10);
        const b = this.getRandomInt(1, 10);
        blankPosition = this.getRandomInt(0, 2); // 0: ��һ����, 1: �����, 2: �ڶ�����
        
        if (blankPosition === 0) {
          expression = `? + ${b} = ${a + b}`;
          answer = a;
        } else if (blankPosition === 1) {
          const operator = this.getRandomOperator(['+', '-']);
          expression = `${a} ? ${b} = ${operator === '+' ? a + b : a - b}`;
          answer = operator;
        } else {
          expression = `${a} + ? = ${a + b}`;
          answer = b;
        }
        break;
        
      case 'medium':
        const num1 = this.getRandomInt(10, 50);
        const num2 = this.getRandomInt(10, 50);
        blankPosition = this.getRandomInt(0, 1);
        
        if (blankPosition === 0) {
          expression = `? × ${num2} = ${num1 * num2}`;
          answer = num1;
        } else {
          expression = `${num1} × ? = ${num1 * num2}`;
          answer = num2;
        }
        break;
        
      case 'hard':
        const base = this.getRandomInt(2, 5);
        const exponent = this.getRandomInt(2, 4);
        blankPosition = this.getRandomInt(0, 2);
        
        if (blankPosition === 0) {
          expression = `?^${exponent} = ${Math.pow(base, exponent)}`;
          answer = base;
        } else if (blankPosition === 1) {
          expression = `${base}^? = ${Math.pow(base, exponent)}`;
          answer = exponent;
        } else {
          expression = `${base}^${exponent} = ?`;
          answer = Math.pow(base, exponent);
        }
        break;
        
      default:
        const x = this.getRandomInt(1, 5);
        const y = this.getRandomInt(1, 5);
        expression = `? + ${y} = ${x + y}`;
        answer = x;
    }
    
    return {
      type: 'fill_blank',
      difficulty: difficulty,
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, difficulty, true)
    };
  }

  // ����ѡ����ѡ��
  generateOptions(correctAnswer, difficulty, isFillBlank = false) {
    const options = [correctAnswer];
    let range;
    
    // �����Ѷ����ø����Χ
    switch (difficulty) {
      case 'easy':
        range = 3;
        break;
      case 'medium':
        range = Math.max(2, Math.floor(Math.abs(correctAnswer) * 0.2));
        break;
      case 'hard':
        range = Math.max(5, Math.floor(Math.abs(correctAnswer) * 0.3));
        break;
      default:
        range = 3;
    }
    
    // ���ɸ�����
    while (options.length < 4) {
      let option;
      
      if (isFillBlank && typeof correctAnswer === 'string') {
        // ���������������ѡ��
        const otherOperators = this.operators.filter(op => op !== correctAnswer);
        option = otherOperators[Math.floor(Math.random() * otherOperators.length)];
      } else {
        // ����ѡ��
        const variation = this.getRandomInt(-range, range);
        option = correctAnswer + variation;
        
        // ȷ��ѡ�Ϊ���������ڵ��꼶��
        if (difficulty === 'easy' && option < 0) {
          option = Math.abs(option);
        }
      }
      
      // �����ظ�ѡ��
      if (!options.includes(option)) {
        options.push(option);
      }
    }
    
    // ����ѡ��˳��
    return this.shuffleArray(options);
  }

  // �������ʽ���
  calculateExpression(expression) {
    // Normalize various operator glyphs to JS operators
    const jsExpression = expression
      .replace(/[×＊]/g, '*') // support unicode multiply (×, fullwidth asterisk)
      .replace(/[÷∕]/g, '/'); // support unicode division (÷, division slash)
    
    try {
      // ʹ��Function���캯������eval�İ�ȫ����
      return new Function(`return ${jsExpression}`)();
    } catch (error) {
      console.error('�������ʽ����:', expression, error);
      return 0;
    }
  }

  // �����ȡ�����
  getRandomOperator(availableOperators = null) {
    const ops = availableOperators || this.operators;
    return ops[Math.floor(Math.random() * ops.length)];
  }

  // �����������
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ��������
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // ����ΨһID
  generateId() {
    return `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ��֤��
  validateAnswer(problem, userAnswer) {
    let isCorrect = false;
    
    if (problem.type === 'comparison') {
      isCorrect = userAnswer === problem.answer;
    } else if (problem.type === 'fill_blank' && typeof problem.answer === 'string') {
      isCorrect = userAnswer === problem.answer;
    } else {
      // ���ִ𰸱Ƚϣ�����һ���ľ������
      const numAnswer = typeof problem.answer === 'number' ? problem.answer : parseFloat(problem.answer);
      const numUserAnswer = typeof userAnswer === 'number' ? userAnswer : parseFloat(userAnswer);
      isCorrect = Math.abs(numAnswer - numUserAnswer) < 0.0001;
    }
    
    return isCorrect;
  }

  // ��ȡ��Ŀ��������
  getProblemTypeDescription(type) {
    const descriptions = {
      'addition': '�ӷ�',
      'subtraction': '����',
      'multiplication': '�˷�',
      'division': '����',
      'mixed': '�������',
      'comparison': '�Ƚϴ�С',
      'fill_blank': '�����'
    };
    
    return descriptions[type] || '��ѧ��';
  }

  // ��ȡ�Ѷ�����
  getDifficultyDescription(difficulty) {
    const descriptions = {
      'easy': '��',
      'medium': '�е�',
      'hard': '����'
    };
    
    return descriptions[difficulty] || '��ͨ';
  }
}

module.exports = ProblemService;