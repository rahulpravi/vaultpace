/**
 * Evaluates basic arithmetic mathematical expressions with proper operator precedence.
 * Supports +, -, × (*), ÷ (/), decimals, and negative numbers.
 * Safe math evaluator without eval() or Function().
 */
export function evaluateMathExpression(expr: string): number | null {
  if (!expr || typeof expr !== 'string' || !expr.trim()) return null;

  // Normalize operator symbols: '×' -> '*', '÷' -> '/'
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9.+\-*/ ]/g, '')
    .trim();

  // Strip trailing uncompleted operators (e.g. "500 +" -> "500")
  const sanitized = normalized.replace(/[+\-*/\s]+$/, '').trim();
  if (!sanitized) return null;

  const tokens: (number | string)[] = [];
  let currentNum = '';

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    if (char === ' ') continue;

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      // Check if this is a unary negative sign
      if (
        char === '-' &&
        (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string') &&
        currentNum === ''
      ) {
        currentNum = '-';
        continue;
      }

      if (currentNum !== '') {
        const n = parseFloat(currentNum);
        if (isNaN(n)) return null;
        tokens.push(n);
        currentNum = '';
      }
      tokens.push(char);
    } else if ((char >= '0' && char <= '9') || char === '.') {
      currentNum += char;
    }
  }

  if (currentNum !== '') {
    const n = parseFloat(currentNum);
    if (isNaN(n)) return null;
    tokens.push(n);
  }

  if (tokens.length === 0) return null;
  if (tokens.length === 1 && typeof tokens[0] === 'number') return tokens[0];

  // Pass 1: Handle high-precedence multiplication (*) and division (/)
  const pass1: (number | string)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '*' || token === '/') {
      const prev = pass1.pop();
      const next = tokens[i + 1];
      if (typeof prev !== 'number' || typeof next !== 'number') return null;

      if (token === '*') {
        pass1.push(prev * next);
      } else {
        if (next === 0) return null; // Avoid division by zero
        pass1.push(prev / next);
      }
      i += 2;
    } else {
      pass1.push(token);
      i += 1;
    }
  }

  // Pass 2: Handle low-precedence addition (+) and subtraction (-)
  let result = pass1[0];
  if (typeof result !== 'number') return null;

  let j = 1;
  while (j < pass1.length) {
    const op = pass1[j];
    const next = pass1[j + 1];
    if (typeof next !== 'number') return null;

    if (op === '+') {
      result += next;
    } else if (op === '-') {
      result -= next;
    }
    j += 2;
  }

  return isNaN(result) || !isFinite(result) ? null : result;
}

/**
 * Checks whether the given string contains an arithmetic operator.
 */
export function hasArithmeticOperator(str: string): boolean {
  if (!str) return false;
  return /[+\-×÷*/]/.test(str);
}

