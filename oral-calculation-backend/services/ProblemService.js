class ProblemService {
  constructor() {
    this.operators = ['+', '-', '×', '÷'];
  }

  generateProblems(type, difficulty, count = 10) {
    const problems = [];
    
    for (let i = 0; i < count; i++) {
      let problem;
      
      switch (type) {
        // --- 1-12 (原有及第一批新增) ---
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
        case 'addition_10': 
          problem = this.generateAddition_10();
          break;
        case 'subtraction_10':
          problem = this.generateSubtraction_10();
          break;
        case 'addition_20_carry':
          problem = this.generateAddition_20_carry();
          break;
        case 'subtraction_20_borrow':
          problem = this.generateSubtraction_20_borrow();
          break;
        case 'mixed_100_add_sub':
          problem = this.generateMixed_100_add_sub();
          break;
        case 'money_conversion':
          problem = this.generateMoneyConversion();
          break;
        case 'multiplication_9x9':
          problem = this.generateMultiplication('easy');
          problem.type = 'multiplication_9x9';
          problem.difficulty = 'easy';
          break;
        case 'division_9x9':
          problem = this.generateDivision('easy');
          problem.type = 'division_9x9';
          problem.difficulty = 'easy';
          break;
        case 'mixed_mul_add':
          problem = this.generateMixed_mul_add();
          break;
        case 'mixed_consecutive_mul':
          problem = this.generateMixed_consecutive_mul();
          break;
        case 'division_with_remainder':
          problem = this.generateDivision('medium');
          problem.type = 'division_with_remainder';
          problem.difficulty = 'medium';
          break;
        case 'time_conversion':
          problem = this.generateTimeConversion();
          break;

        // --- ⬇️ 以下为 13-28 (第二批新增) ⬇️ ---

        // 13. 三位数加减法
        case 'add_sub_3digit':
          problem = this.generateAddSub_3digit();
          break;
          
        // 14. 两位数乘法 (重用)
        case 'multiplication_2digit':
          problem = this.generateMultiplication('hard');
          problem.type = 'multiplication_2digit';
          problem.difficulty = 'medium'; // 按要求设为中等
          break;

        // 15. 长方形、正方形周长的计算
        case 'perimeter_calc':
          problem = this.generatePerimeterCalculation();
          break;
          
        // 16. 长方形、正方形面积的计算
        case 'area_calc':
          problem = this.generateAreaCalculation();
          break;
          
        // 17. 百以内的加减乘除法大小比较
        case 'comparison_100':
          problem = this.generateComparison_100();
          break;
          
        // 18. 重量单位换算
        case 'weight_conversion':
          problem = this.generateWeightConversion();
          break;
          
        // 19. 时间计算
        case 'time_duration':
          problem = this.generateTimeDuration();
          break;
          
        // 20. 余数除法（大数）
        case 'division_with_remainder_large':
          problem = this.generateDivisionWithRemainder_large();
          break;
          
        // 21. 小数的加法和减法
        case 'decimal_add_sub':
          problem = this.generateDecimalAddSub();
          break;
          
        // 22. 小数的保留
        case 'decimal_rounding':
          problem = this.generateDecimalRounding();
          break;
          
        // 23. 两位数的四则运算
        case 'mixed_ops_2digit':
          problem = this.generateMixedOps_2digit();
          break;
          
        // 24. 千以内含括号的四则运算
        case 'mixed_ops_parenthesis':
          problem = this.generateMixedOps_parenthesis();
          break;
          
        // 25. 巧用交换律与结合律
        case 'associative_law':
          problem = this.generateAssociativeLaw();
          break;
          
        // 26. 巧用乘法分配律
        case 'distributive_law':
          problem = this.generateDistributiveLaw();
          break;
          
        // 27. 比较千以内的算式大小比较
        case 'advanced_comparison':
          problem = this.generateAdvancedComparison();
          break;

        // 28. 近似数认识
        case 'number_rounding_unit':
          problem = this.generateNumberRoundingUnit();
          break;

        // --- 默认 ---
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

  // --- 原有生成函数 (无修改) ---
  generateAddition(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': 
        a = this.getRandomInt(1, 20);
        b = this.getRandomInt(1, 20 - a);
        result = a + b;
        break;
      case 'medium':
        a = this.getRandomInt(10, 100);
        b = this.getRandomInt(10, 100);
        result = a + b;
        break;
      case 'hard': 
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
  generateSubtraction(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': 
        a = this.getRandomInt(10, 20);
        b = this.getRandomInt(1, a);
        result = a - b;
        break;
      case 'medium':
        a = this.getRandomInt(50, 100);
        b = this.getRandomInt(1, 50);
        result = a - b;
        break;
      case 'hard':
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
  generateMultiplication(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': 
        a = this.getRandomInt(1, 9);
        b = this.getRandomInt(1, 9);
        result = a * b;
        break;
      case 'medium': 
        a = this.getRandomInt(10, 99);
        b = this.getRandomInt(2, 9);
        result = a * b;
        break;
      case 'hard':
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
  generateDivision(difficulty) {
    let a, b, result;
    
    switch (difficulty) {
      case 'easy': 
        b = this.getRandomInt(1, 9);
        result = this.getRandomInt(1, 9);
        a = b * result;
        break;
      case 'medium':
        b = this.getRandomInt(2, 9);
        result = this.getRandomInt(5, 20); // 商
        const remainder = this.getRandomInt(1, b - 1); // 余数
        a = b * result + remainder;
        return {
          type: 'division',
          difficulty: difficulty,
          expression: `${a} ÷ ${b}`,
          answer: result,
          remainder: remainder,
          options: this.generateOptions(result, difficulty)
        };
      case 'hard': 
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
  generateMixedOperation(difficulty) {
    let a, b, c, operator1, operator2, expression, result;
    
    switch (difficulty) {
      case 'easy': 
        a = this.getRandomInt(1, 20);
        b = this.getRandomInt(1, 20);
        c = this.getRandomInt(1, 20);
        operator1 = this.getRandomOperator(['+', '-']);
        operator2 = this.getRandomOperator(['+', '-']);
        
        expression = `${a} ${operator1} ${b} ${operator2} ${c}`;
        result = this.calculateExpression(expression);
        
        if (result < 0) {
            return this.generateMixedOperation(difficulty);
        }
        break;
        
      case 'medium': 
        a = this.getRandomInt(2, 9);
        b = this.getRandomInt(2, 9);
        c = this.getRandomInt(2, 9);
        operator1 = this.getRandomOperator(['×', '÷']);
        operator2 = this.getRandomOperator(['×', '÷']);
        
        if (operator1 === '÷') {
          const tempResult = this.getRandomInt(2, 5);
          a = b * tempResult;
        }
        
        const intermediateResult = this.calculateExpression(`${a} ${operator1} ${b}`);

        if (operator2 === '÷') {
          const divisors = [];
          for(let i = 2; i <= Math.abs(intermediateResult / 2); i++) {
            if (intermediateResult % i === 0) divisors.push(i);
          }
          if(intermediateResult % intermediateResult === 0) divisors.push(intermediateResult);
          if (divisors.length === 0) {
             c = 1;
          } else {
             c = this.getRandomItem(divisors);
          }
        }
        
        expression = `${a} ${operator1} ${b} ${operator2} ${c}`;
        result = this.calculateExpression(expression);
        break;
        
      case 'hard':
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
  generateFillBlank(difficulty) {
    let expression, answer, blankPosition;
    
    switch (difficulty) {
      case 'easy':
        const a = this.getRandomInt(1, 10);
        const b = this.getRandomInt(1, 10);
        blankPosition = this.getRandomInt(0, 2); 
        
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

  // --- 1-12 (第一批新增) ---
  generateAddition_10() {
    const a = this.getRandomInt(0, 10);
    const b = this.getRandomInt(0, 10 - a);
    const result = a + b;
    
    return {
      type: 'addition_10',
      difficulty: 'easy',
      expression: `${a} + ${b}`,
      answer: result,
      options: this.generateOptions(result, 'easy')
    };
  }
  generateSubtraction_10() {
    const a = this.getRandomInt(0, 10);
    const b = this.getRandomInt(0, a);
    const result = a - b;
    
    return {
      type: 'subtraction_10',
      difficulty: 'easy',
      expression: `${a} - ${b}`,
      answer: result,
      options: this.generateOptions(result, 'easy')
    };
  }
  generateAddition_20_carry() {
    let a, b, result;
    do {
      a = this.getRandomInt(1, 19);
      b = this.getRandomInt(1, 19);
      result = a + b;
    } while (result > 20 || (a % 10 + b % 10) < 10);
    
    return {
      type: 'addition_20_carry',
      difficulty: 'medium',
      expression: `${a} + ${b}`,
      answer: result,
      options: this.generateOptions(result, 'easy')
    };
  }
  generateSubtraction_20_borrow() {
    let a, b, result;
    a = this.getRandomInt(11, 20);
    b = this.getRandomInt(a % 10 + 1, 9);
    result = a - b;

    return {
      type: 'subtraction_20_borrow',
      difficulty: 'medium',
      expression: `${a} - ${b}`,
      answer: result,
      options: this.generateOptions(result, 'easy')
    };
  }
  generateMixed_100_add_sub() {
    let a, b, c, op1, op2, expression, result, intermediate;
    
    do {
      a = this.getRandomInt(1, 99);
      b = this.getRandomInt(1, 99);
      c = this.getRandomInt(1, 99);
      op1 = this.getRandomOperator(['+', '-']);
      op2 = this.getRandomOperator(['+', '-']);
      
      expression = `${a} ${op1} ${b} ${op2} ${c}`;
      intermediate = this.calculateExpression(`${a} ${op1} ${b}`);
      result = this.calculateExpression(expression);

    } while (intermediate < 0 || result < 0 || result > 100);

    return {
      type: 'mixed_100_add_sub',
      difficulty: 'hard',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }
  generateMoneyConversion() {
    let expression, answer;
    const problemType = Math.random();

    if (problemType < 0.5) {
      // 6角9分＝？分
      const jiao = this.getRandomInt(1, 9);
      const fen = this.getRandomInt(1, 9);
      expression = `${jiao}角${fen}分 = ? 分`;
      answer = jiao * 10 + fen;
    } else {
      // 6元4角＝？角
      const yuan = this.getRandomInt(1, 9);
      const jiao = this.getRandomInt(1, 9);
      expression = `${yuan}元${jiao}角 = ? 角`;
      answer = yuan * 10 + jiao;
    }

    return {
      type: 'money_conversion',
      difficulty: 'medium',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }
  generateMixed_mul_add() {
    const a = this.getRandomInt(1, 9);
    const b = this.getRandomInt(1, 9);
    const c = this.getRandomInt(1, 50); 
    
    let expression, result;
    if (Math.random() > 0.5) {
      expression = `${a} × ${b} + ${c}`;
      result = a * b + c;
    } else {
      expression = `${c} + ${a} × ${b}`;
      result = c + a * b;
    }

    return {
      type: 'mixed_mul_add',
      difficulty: 'medium',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }
  generateMixed_consecutive_mul() {
    const a = this.getRandomInt(1, 10);
    const b = this.getRandomInt(1, 10);
    const c = this.getRandomInt(1, 10);
    
    const expression = `${a} × ${b} × ${c}`;
    const result = a * b * c;

    return {
      type: 'mixed_consecutive_mul',
      difficulty: 'medium',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }
  generateTimeConversion() {
    let expression, answer;
    const problemType = Math.random();

    if (problemType < 0.5) {
      const min = this.getRandomInt(1, 9);
      const sec = this.getRandomInt(1, 59);
      expression = `${min}分${sec}秒 = ? 秒`;
      answer = min * 60 + sec;
    } else {
      const hour = this.getRandomInt(1, 9);
      const min = this.getRandomInt(1, 59);
      expression = `${hour}时${min}分 = ? 分`;
      answer = hour * 60 + min;
    }
    
    return {
      type: 'time_conversion',
      difficulty: 'medium',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }
  
  // --- ⬇️ 13-28 (第二批新增) ⬇️ ---

  /**
   * 13. 三位数加减法
   */
  generateAddSub_3digit() {
    const op = this.getRandomOperator(['+', '-']);
    let a, b, result;

    if (op === '+') {
      a = this.getRandomInt(100, 999);
      b = this.getRandomInt(100, 999);
      result = a + b;
    } else {
      a = this.getRandomInt(100, 999);
      b = this.getRandomInt(100, a); // 确保a>b
      result = a - b;
    }
    
    return {
      type: 'add_sub_3digit',
      difficulty: 'simple',
      expression: `${a} ${op} ${b}`,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }
  
  /**
   * 15. 长方形、正方形周长的计算
   */
  generatePerimeterCalculation() {
    let expression, answer;
    if (Math.random() > 0.5) {
      // 长方形
      const l = this.getRandomInt(1, 400);
      const w = this.getRandomInt(1, 100);
      expression = `长方形长${l}cm, 宽${w}cm, 周长是? cm`;
      answer = 2 * (l + w);
    } else {
      // 正方形
      const s = this.getRandomInt(1, 250);
      expression = `正方形边长${s}cm, 周长是? cm`;
      answer = 4 * s;
    }

    return {
      type: 'perimeter_calc',
      difficulty: 'simple',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }

  /**
   * 16. 长方形、正方形面积的计算
   */
  generateAreaCalculation() {
    let expression, answer;
    if (Math.random() > 0.5) {
      // 长方形
      const l = this.getRandomInt(1, 100);
      const w = this.getRandomInt(1, 100);
      expression = `长方形长${l}cm, 宽${w}cm, 面积是? cm²`;
      answer = l * w;
    } else {
      // 正方形
      const s = this.getRandomInt(1, 100);
      expression = `正方形边长${s}cm, 面积是? cm²`;
      answer = s * s;
    }

    return {
      type: 'area_calc',
      difficulty: 'medium',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }
  
  /**
   * 17. 百以内的加减乘除法大小比较
   */
  generateComparison_100() {
    let a, b, leftExpr, leftVal;
    const op = this.getRandomOperator(['+', '-', '×', '÷']);
    
    if(op === '÷') {
      b = this.getRandomInt(2, 10);
      a = b * this.getRandomInt(2, 10);
      leftExpr = `${a} ÷ ${b}`;
    } else if (op === '×') {
      a = this.getRandomInt(1, 10);
      b = this.getRandomInt(1, 10);
      leftExpr = `${a} × ${b}`;
    } else { // + or -
      a = this.getRandomInt(1, 100);
      b = this.getRandomInt(1, 100);
      leftExpr = `${a} ${op} ${b}`;
    }
    
    leftVal = this.calculateExpression(leftExpr);
    // 确保不出现负数
    if (leftVal < 0) return this.generateComparison_100(); 
    
    const rightVal = this.getRandomInt(1, 200);
    const answer = leftVal > rightVal ? '>' : (leftVal < rightVal ? '<' : '=');

    return {
      type: 'comparison_100',
      difficulty: 'hard',
      expression: `${leftExpr} ? ${rightVal}`,
      answer: answer,
      options: ['>', '<', '=']
    };
  }
  
  /**
   * 18. 重量单位换算
   */
  generateWeightConversion() {
    const t = this.getRandomInt(1, 99);
    const expression = `${t}吨 = ? 千克`;
    const answer = t * 1000;
    
    return {
      type: 'weight_conversion',
      difficulty: 'simple',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'hard')
    };
  }

  /**
   * 19. 时间计算
   */
  generateTimeDuration() {
    let h1, m1, h2, m2, time1, time2;
    
    // 循环确保 time2 > time1
    do {
      h1 = this.getRandomInt(0, 23);
      m1 = this.getRandomInt(0, 59);
      h2 = this.getRandomInt(h1, 23);
      m2 = this.getRandomInt(0, 59);
      
      time1 = h1 * 60 + m1;
      time2 = h2 * 60 + m2;
    } while (time2 <= time1);
    
    const answer = time2 - time1;
    const timeStr1 = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`;
    const timeStr2 = `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
    
    return {
      type: 'time_duration',
      difficulty: 'hard',
      expression: `${timeStr1}到${timeStr2}是 ? 分钟`,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }

  /**
   * 20. 余数除法（大数）
   */
  generateDivisionWithRemainder_large() {
    const a = this.getRandomInt(1, 1000);
    const b = this.getRandomInt(2, 100);
    
    const result = Math.floor(a / b);
    const remainder = a % b;
    
    return {
      type: 'division_with_remainder_large',
      difficulty: 'hard',
      expression: `${a} ÷ ${b}`,
      answer: result,
      remainder: remainder,
      // 选项是关于商的
      options: this.generateOptions(result, 'medium')
    };
  }

  /**
   * 21. 小数的加法和减法
   */
  generateDecimalAddSub() {
    const op = this.getRandomOperator(['+', '-']);
    const precision = 100; // 最多两位小数
    
    let a, b, result;
    a = this.getRandomInt(1, 9999) / precision;
    b = this.getRandomInt(1, 9999) / precision;

    if (op === '-' && b > a) {
      [a, b] = [b, a]; // 交换a, b确保a > b
    }
    
    if (op === '+') {
      result = a + b;
    } else {
      result = a - b;
    }
    
    // 修正JS浮点数精度问题
    result = parseFloat(result.toFixed(2));
    
    return {
      type: 'decimal_add_sub',
      difficulty: 'simple',
      expression: `${a} ${op} ${b}`,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }

  /**
   * 22. 小数的保留
   */
  generateDecimalRounding() {
    // 生成一个3-4位小数的数字
    const num = parseFloat((Math.random() * 100).toFixed(this.getRandomInt(3, 4)));
    const decimals = this.getRandomInt(1, 2); // 保留一位或两位
    
    const expression = `${num} (保留${decimals}位小数)`;
    const answer = parseFloat(num.toFixed(decimals));
    
    return {
      type: 'decimal_rounding',
      difficulty: 'simple',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'easy')
    };
  }

  /**
   * 23. 两位数的四则运算
   */
  generateMixedOps_2digit() {
    const a = this.getRandomInt(10, 99);
    const b = this.getRandomInt(10, 99);
    const c = this.getRandomInt(10, 99);
    const op1 = this.getRandomItem(['×', '÷']);
    const op2 = this.getRandomItem(['+', '-']);
    
    let expression, result;
    
    if(op1 === '÷') {
      // a ÷ b + c
      const div_res = this.getRandomInt(2, 9);
      const temp_a = b * div_res;
      expression = `${temp_a} ÷ ${b} ${op2} ${c}`;
    } else {
      // a × b + c
      expression = `${a} × ${b} ${op2} ${c}`;
    }
    
    result = this.calculateExpression(expression);
    
    return {
      type: 'mixed_ops_2digit',
      difficulty: 'medium',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }

  /**
   * 24. 千以内含括号的四则运算
   */
  generateMixedOps_parenthesis() {
    const a = this.getRandomInt(2, 9);
    const op = this.getRandomItem(['+', '-']);
    let b, c;
    
    if (op === '+') {
      b = this.getRandomInt(100, 899);
      c = this.getRandomInt(1, 999 - b);
    } else {
      b = this.getRandomInt(100, 999);
      c = this.getRandomInt(1, b);
    }
    
    const expression = `${a} × (${b} ${op} ${c})`;
    const result = this.calculateExpression(expression);
    
    return {
      type: 'mixed_ops_parenthesis',
      difficulty: 'medium',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'hard')
    };
  }
  
  /**
   * 25. 巧用交换律与结合律
   */
  generateAssociativeLaw() {
    const a = this.getRandomInt(100, 800);
    const b = (Math.floor(a / 100) + 1) * 100 - a; // 凑整
    if (b === 0) return this.generateAssociativeLaw(); // 避免b=0
    
    const c = this.getRandomInt(100, 900);
    
    let nums = [a, b, c];
    nums = this.shuffleArray(nums); // 打乱顺序
    
    const expression = `${nums[0]} + ${nums[1]} + ${nums[2]}`;
    const result = a + b + c;
    
    return {
      type: 'associative_law',
      difficulty: 'hard',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }
  
  /**
   * 26. 巧用乘法分配律
   */
  generateDistributiveLaw() {
    let expression, result;
    
    if (Math.random() > 0.5) {
      // (a ± b) * c
      const c = this.getRandomInt(10, 99);
      const a = this.getRandomInt(10, 99);
      const b = this.getRandomInt(10, a);
      const op = this.getRandomItem(['+', '-']);
      
      expression = `${a} × ${c} ${op} ${b} × ${c}`;
      result = (op === '+') ? (a + b) * c : (a - b) * c;
      
    } else {
      // (a ± b) / c
      const c = this.getRandomInt(2, 9);
      const a = c * this.getRandomInt(10, 99);
      const b = c * this.getRandomInt(10, 99);
      const op = this.getRandomItem(['+', '-']);
      
      expression = `${a} ÷ ${c} ${op} ${b} ÷ ${c}`;
      result = (op === '+') ? (a + b) / c : (a - b) / c;
    }
    
    return {
      type: 'distributive_law',
      difficulty: 'hard',
      expression: expression,
      answer: result,
      options: this.generateOptions(result, 'medium')
    };
  }

  /**
   * 27. 比较千以内的算式大小比较
   */
  generateAdvancedComparison() {
    const a = this.getRandomInt(10, 99);
    const b = this.getRandomInt(10, 99);
    const c = this.getRandomInt(10, 99);
    const op = this.getRandomItem(['+', '-']);
    
    const leftExpr = `${a} × ${b} ${op} ${c}`;
    const rightExpr = `${a} × (${b} ${op} ${c})`;
    
    const leftVal = this.calculateExpression(leftExpr);
    const rightVal = this.calculateExpression(rightExpr);
    
    const answer = leftVal > rightVal ? '>' : (leftVal < rightVal ? '<' : '=');
    
    return {
      type: 'advanced_comparison',
      difficulty: 'hard',
      expression: `${leftExpr} ? ${rightExpr}`,
      answer: answer,
      options: ['>', '<', '=']
    };
  }
  
  /**
   * 28. 近似数认识
   */
  generateNumberRoundingUnit() {
    const units = [{name: '万', val: 10000}, {name: '亿', val: 100000000}];
    const unit = this.getRandomItem(units);
    
    // 生成一个在单位值附近但又不精确的数
    const base = this.getRandomInt(1, 999);
    const num = base * unit.val + this.getRandomInt(Math.floor(unit.val / 10) * -4, Math.floor(unit.val / 10) * 4);

    if (num <= 0) return this.generateNumberRoundingUnit(); // 避免负数
    
    const expression = `${num} ≈ ? ${unit.name}`;
    const answer = Math.round(num / unit.val);
    
    return {
      type: 'number_rounding_unit',
      difficulty: 'medium',
      expression: expression,
      answer: answer,
      options: this.generateOptions(answer, 'medium')
    };
  }


  // --- ⬇️ 以下是辅助函数 (修改了 generateOptions, 增加了 getRandomItem) ⬇️ ---

  generateOptions(correctAnswer, difficulty, isFillBlank = false) {
    const options = new Set([correctAnswer]); // 使用Set确保唯一性
    let range;
    
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
    
    // 确保range最小为1，避免在correctAnswer为0时卡死
    if (range === 0) range = 1;
    
    while (options.size < 4) {
      let option;
      
      if (isFillBlank && typeof correctAnswer === 'string') {
        const otherOperators = this.operators.filter(op => op !== correctAnswer);
        option = this.getRandomItem(otherOperators);
      } else {
        const variation = this.getRandomInt(-range, range);
        
        // 确保 variation 不为 0
        if (variation === 0) {
           option = correctAnswer + (Math.random() > 0.5 ? 1 : -1);
        } else {
           option = correctAnswer + variation;
        }

        // 处理小数
        if (typeof correctAnswer === 'number' && !Number.isInteger(correctAnswer)) {
            const decimalPlaces = correctAnswer.toString().split('.')[1]?.length || 2;
            option = parseFloat(option.toFixed(decimalPlaces));
        }

        if (difficulty === 'easy' && option < 0) {
          option = Math.abs(option); // 简单难度避免负数选项
        }
      }
      
      options.add(option);
    }
    
    return this.shuffleArray(Array.from(options));
  }

  calculateExpression(expression) {
    const jsExpression = expression
      .replace(/[×＊]/g, '*') 
      .replace(/[÷∕]/g, '/')
      .replace(/cm|cm²|kg|吨|秒|分|时|元|角/g, '') // 移除单位
      .replace(/≈/g, '') // 移除约等于
      .replace(/（/g, '(') // 修正括号
      .replace(/）/g, ')');
    
    try {
      return new Function(`return ${jsExpression}`)();
    } catch (error) {
      console.error('表达式计算错误:', expression, error);
      return 0;
    }
  }

  getRandomOperator(availableOperators = null) {
    const ops = availableOperators || this.operators;
    return ops[Math.floor(Math.random() * ops.length)];
  }

  /**
   * 从数组中随机获取一个元素
   */
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  generateId() {
    return `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateAnswer(problem, userAnswer) {
    let isCorrect = false;

    // 处理带余数的除法：兼容多种前端提交格式
    if (problem.hasOwnProperty('remainder')) {
      let userQuotient = null;
      let userRemainder = null;

      // 如果前端传来的是对象（如 {quotient, remainder}）
      if (userAnswer && typeof userAnswer === 'object') {
        userQuotient = Number(userAnswer.quotient ?? userAnswer.q ?? userAnswer.qo ?? userAnswer.quotientAnswer ?? null);
        // 有时候前端把余数字段命名为 remainder / r / rem
        userRemainder = Number(userAnswer.remainder ?? userAnswer.r ?? userAnswer.rem ?? null);
      } else if (typeof userAnswer === 'number') {
        userQuotient = Number(userAnswer);
      } else if (typeof userAnswer === 'string') {
        // 支持多种字符串格式："商...余数"、"商 余 余数"、"商,余数"、只是商
        const s = userAnswer.trim();
        if (s.includes('...')) {
          const parts = s.split('...').map(p => p.trim());
          userQuotient = Number(parts[0]);
          userRemainder = parts[1] !== undefined ? Number(parts[1]) : null;
        } else if (s.includes('余')) {
          const parts = s.split(/余|\s+/).filter(Boolean);
          // parts 可能是 ["商","余数"] 或包含其它分隔
          userQuotient = Number(parts[0]);
          userRemainder = parts[1] !== undefined ? Number(parts[1]) : null;
        } else {
          // 尝试提取数字序列
          const nums = s.match(/-?\d+/g);
          if (nums && nums.length > 0) {
            userQuotient = Number(nums[0]);
            if (nums.length > 1) userRemainder = Number(nums[1]);
          }
        }
      }

      // 如果前端在 submitted 对象上单独传了 remainder 字段（路由中会带上），优先使用它
      if (problem.remainder !== undefined && (userRemainder === null || Number.isNaN(userRemainder))) {
        // 如果 userAnswer 没有余数，但提交体中有 remainder 字段，则把它作为期望的 remainder（不覆盖用户提交）
        // 不修改 userRemainder，因为这是用户填写的，如果未填则保持 null
      }

      // 比较：如果用户提供了余数则同时比较商和余数；否则只比较商
      const hasValidQuot = Number.isFinite(userQuotient) && !Number.isNaN(userQuotient);
      const hasValidRem = Number.isFinite(userRemainder) && !Number.isNaN(userRemainder);

      if (hasValidQuot && hasValidRem) {
        isCorrect = Math.abs(problem.answer - userQuotient) < 0.0001 && Math.abs(problem.remainder - userRemainder) < 0.0001;
      } else if (hasValidQuot) {
        isCorrect = Math.abs(problem.answer - userQuotient) < 0.0001;
      } else {
        // 无法解析用户答案为数字 -> 判错
        isCorrect = false;
      }

      return isCorrect;
    }

    if (problem.type === 'comparison') {
      isCorrect = userAnswer === problem.answer;
    } else if (problem.type === 'fill_blank' && typeof problem.answer === 'string') {
      isCorrect = userAnswer === problem.answer;
    } else if (problem.type === 'decimal_rounding' || String(problem.type).indexOf('round') !== -1) {
      // 处理小数保留题：允许用户输入如 41.10 与 41.1 等等等价表达
      const numAnswer = typeof problem.answer === 'number' ? problem.answer : parseFloat(problem.answer);
      const numUser = typeof userAnswer === 'number' ? userAnswer : parseFloat(userAnswer);
      if (!Number.isFinite(numUser) || !Number.isFinite(numAnswer)) {
        isCorrect = false;
      } else {
        // 从题干中提取保留位数：例如 "(保留1位小数)" 或 "保留1位小数"
        let decimals = null;
        try {
          const expr = String(problem.expression || '');
          // 支持阿拉伯数字和中文数字（如 一 二 三 四 五 六 七 八 九 十 两）
          const m = expr.match(/保留\s*([0-9一二三四五六七八九十两]+)\s*位/);
          if (m && m[1]) {
            const raw = m[1];
            // 如果是中文数字，进行映射
            const cnMap = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'两':2 };
            if (/^[0-9]+$/.test(raw)) {
              decimals = parseInt(raw);
            } else if (raw.length === 1 && cnMap[raw]) {
              decimals = cnMap[raw];
            } else {
              // 对于像 "两" 或更复杂的中文，尝试逐字累加（简单处理）
              let acc = 0;
              for (const ch of raw) {
                if (cnMap[ch]) acc += cnMap[ch];
              }
              if (acc > 0) decimals = acc;
            }
          }
        } catch (e) {
          decimals = null;
        }
        // 默认比较到 2 位小数的容差，如果能确定 decimals 则按该位比较
        if (decimals === null || Number.isNaN(decimals)) decimals = 2;

        const factor = Math.pow(10, decimals);
        const roundedUser = Math.round(numUser * factor) / factor;
        const roundedAnswer = Math.round(numAnswer * factor) / factor;
        isCorrect = Math.abs(roundedUser - roundedAnswer) < 0.0001;
      }
    } else {
      const numAnswer = typeof problem.answer === 'number' ? problem.answer : parseFloat(problem.answer);
      const numUserAnswer = typeof userAnswer === 'number' ? userAnswer : parseFloat(userAnswer);
      isCorrect = Math.abs(numAnswer - numUserAnswer) < 0.0001;
    }
    
    return isCorrect;
  }

  getProblemTypeDescription(type) {
    const descriptions = {
      // 原有
      'addition': '加法',
      'subtraction': '减法',
      'multiplication': '乘法',
      'division': '除法',
      'mixed': '混合运算',
      'comparison': '比较大小',
      'fill_blank': '填空题',
      // 1-12
      'addition_10': '10以内加法',
      'subtraction_10': '10以内减法',
      'addition_20_carry': '20以内进位加法',
      'subtraction_20_borrow': '20以内借位减法',
      'mixed_100_add_sub': '100以内加减混合',
      'money_conversion': '元角分换算',
      'multiplication_9x9': '9x9乘法',
      'division_9x9': '9x9除法',
      'mixed_mul_add': '乘加混合',
      'mixed_consecutive_mul': '连续乘法',
      'division_with_remainder': '带余数除法',
      'time_conversion': '时间换算',
      // 13-28
      'add_sub_3digit': '三位数加减法',
      'multiplication_2digit': '两位数乘法',
      'perimeter_calc': '周长计算',
      'area_calc': '面积计算',
      'comparison_100': '百以内大小比较',
      'weight_conversion': '重量单位换算',
      'time_duration': '时间计算',
      'division_with_remainder_large': '大数余数除法',
      'decimal_add_sub': '小数加减法',
      'decimal_rounding': '小数的保留',
      'mixed_ops_2digit': '两位数四则运算',
      'mixed_ops_parenthesis': '带括号四则运算',
      'associative_law': '巧用结合律',
      'distributive_law': '巧用分配律',
      'advanced_comparison': '算式大小比较',
      'number_rounding_unit': '近似数认识'
    };
    
    return descriptions[type] || '综合';
  }

  getDifficultyDescription(difficulty) {
    const descriptions = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    
    return descriptions[difficulty] || '未知';
  }
}

module.exports = ProblemService;