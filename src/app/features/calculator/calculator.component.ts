import { Component, computed, signal } from '@angular/core';

type CalcButtonVariant = 'digit' | 'operator' | 'function' | 'action' | 'equals' | 'constant';

interface CalcButton {
  label: string;
  value: string;
  ariaLabel: string;
  variant: CalcButtonVariant;
  colspan?: number;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
})
export class CalculatorComponent {
  readonly expression = signal('');
  readonly error = signal<string | null>(null);
  readonly result = signal<string | null>(null);
  readonly angleMode = signal<'deg' | 'rad'>('deg');

  readonly displayValue = computed(() => {
    if (this.error()) {
      return this.expression() || '0';
    }
    if (this.result() !== null) {
      return this.result()!;
    }
    return this.expression() || '0';
  });

  readonly buttons: CalcButton[] = [
    { label: 'C', value: 'clear', ariaLabel: 'Clear all', variant: 'action' },
    { label: 'CE', value: 'clearEntry', ariaLabel: 'Clear entry', variant: 'action' },
    { label: '⌫', value: 'backspace', ariaLabel: 'Backspace', variant: 'action' },
    { label: '÷', value: '÷', ariaLabel: 'Divide', variant: 'operator' },
    { label: 'sin', value: 'sin(', ariaLabel: 'Sine', variant: 'function' },
    { label: 'cos', value: 'cos(', ariaLabel: 'Cosine', variant: 'function' },
    { label: 'tan', value: 'tan(', ariaLabel: 'Tangent', variant: 'function' },
    { label: '×', value: '×', ariaLabel: 'Multiply', variant: 'operator' },
    { label: 'log', value: 'log(', ariaLabel: 'Logarithm base 10', variant: 'function' },
    { label: 'ln', value: 'ln(', ariaLabel: 'Natural logarithm', variant: 'function' },
    { label: '√', value: '√(', ariaLabel: 'Square root', variant: 'function' },
    { label: '−', value: '−', ariaLabel: 'Subtract', variant: 'operator' },
    { label: '(', value: '(', ariaLabel: 'Open parenthesis', variant: 'operator' },
    { label: ')', value: ')', ariaLabel: 'Close parenthesis', variant: 'operator' },
    { label: '^', value: '^', ariaLabel: 'Power', variant: 'operator' },
    { label: '+', value: '+', ariaLabel: 'Add', variant: 'operator' },
    { label: '7', value: '7', ariaLabel: '7', variant: 'digit' },
    { label: '8', value: '8', ariaLabel: '8', variant: 'digit' },
    { label: '9', value: '9', ariaLabel: '9', variant: 'digit' },
    { label: 'π', value: 'π', ariaLabel: 'Pi', variant: 'constant' },
    { label: '4', value: '4', ariaLabel: '4', variant: 'digit' },
    { label: '5', value: '5', ariaLabel: '5', variant: 'digit' },
    { label: '6', value: '6', ariaLabel: '6', variant: 'digit' },
    { label: 'e', value: 'e', ariaLabel: "Euler's number", variant: 'constant' },
    { label: '1', value: '1', ariaLabel: '1', variant: 'digit' },
    { label: '2', value: '2', ariaLabel: '2', variant: 'digit' },
    { label: '3', value: '3', ariaLabel: '3', variant: 'digit' },
    { label: '=', value: 'equals', ariaLabel: 'Equals', variant: 'equals' },
    { label: '0', value: '0', ariaLabel: '0', variant: 'digit', colspan: 2 },
    { label: '.', value: '.', ariaLabel: 'Decimal point', variant: 'digit' },
  ];

  onButtonClick(button: CalcButton): void {
    switch (button.value) {
      case 'clear':
        this.clearAll();
        break;
      case 'clearEntry':
        this.clearEntry();
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'equals':
        this.evaluate();
        break;
      default:
        this.appendInput(button.value, button.variant);
    }
  }

  toggleAngleMode(): void {
    this.angleMode.update((mode) => (mode === 'deg' ? 'rad' : 'deg'));
  }

  private clearAll(): void {
    this.expression.set('');
    this.error.set(null);
    this.result.set(null);
  }

  private clearEntry(): void {
    const current = this.expression();
    if (!current) {
      this.error.set(null);
      this.result.set(null);
      return;
    }
    this.expression.set(this.removeLastToken(current));
    this.error.set(null);
    this.result.set(null);
  }

  private backspace(): void {
    const current = this.expression();
    if (!current) {
      return;
    }
    this.expression.set(current.slice(0, -1));
    this.error.set(null);
    this.result.set(null);
  }

  private appendInput(value: string, variant: CalcButtonVariant): void {
    this.error.set(null);
    const priorResult = this.result();

    if (priorResult !== null) {
      if (variant === 'operator' && this.isChainingOperator(value)) {
        this.expression.set(priorResult + value);
      } else {
        this.expression.set(value);
      }
      this.result.set(null);
      return;
    }

    this.expression.update((expr) => expr + value);
  }

  private isChainingOperator(value: string): boolean {
    return ['+', '−', '×', '÷', '^'].includes(value);
  }

  private evaluate(): void {
    const expr = this.expression().trim();
    if (!expr) {
      return;
    }

    try {
      const value = evaluateExpression(expr, this.angleMode());
      if (!Number.isFinite(value)) {
        this.error.set('Invalid expression');
        this.result.set(null);
        return;
      }
      this.result.set(formatResult(value));
      this.error.set(null);
    } catch {
      this.error.set('Invalid expression');
      this.result.set(null);
    }
  }

  private removeLastToken(expr: string): string {
    const functionNames = ['sin', 'cos', 'tan', 'log', 'ln'];
    for (const fn of functionNames) {
      if (expr.endsWith(`${fn}(`)) {
        return expr.slice(0, -(fn.length + 1));
      }
    }
    if (expr.endsWith('√(')) {
      return expr.slice(0, -2);
    }
    if (expr.endsWith('π') || expr.endsWith('e')) {
      return expr.slice(0, -1);
    }
    if (/[0-9.]$/.test(expr)) {
      return expr.replace(/[0-9.]+$/, '');
    }
    if (/[+\−×÷^()]$/.test(expr)) {
      return expr.slice(0, -1);
    }
    return '';
  }
}

function formatResult(value: number): string {
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

function evaluateExpression(raw: string, angleMode: 'deg' | 'rad' = 'deg'): number {
  const normalized = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√\(/g, 'sqrt(');

  const tokens = tokenize(normalized);
  const parser = new ExpressionParser(tokens, angleMode);
  const result = parser.parse();
  if (parser.hasRemaining()) {
    throw new Error('Unexpected tokens');
  }
  return result;
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; name: string }
  | { type: 'operator'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === ' ' || char === '\t') {
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if ('+-*/^'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    if (char === 'π') {
      tokens.push({ type: 'number', value: Math.PI });
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numStr = char;
      i++;
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      const value = Number(numStr);
      if (Number.isNaN(value)) {
        throw new Error('Invalid number');
      }
      tokens.push({ type: 'number', value });
      continue;
    }

    if (/[a-z]/i.test(char)) {
      let name = char;
      i++;
      while (i < input.length && /[a-z]/i.test(input[i])) {
        name += input[i];
        i++;
      }
      tokens.push({ type: 'identifier', name: name.toLowerCase() });
      continue;
    }

    throw new Error(`Invalid character: ${char}`);
  }

  return tokens;
}

class ExpressionParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly angleMode: 'deg' | 'rad' = 'deg',
  ) {}

  hasRemaining(): boolean {
    return this.index < this.tokens.length;
  }

  parse(): number {
    return this.parseExpression();
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (this.matchOperator(['+', '-'])) {
      const op = this.previousOperator()!;
      const right = this.parseTerm();
      value = op === '+' ? value + right : value - right;
    }

    return value;
  }

  private parseTerm(): number {
    let value = this.parsePower();

    while (this.matchOperator(['*', '/'])) {
      const op = this.previousOperator()!;
      const right = this.parsePower();
      if (op === '/') {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        value /= right;
      } else {
        value *= right;
      }
    }

    return value;
  }

  private parsePower(): number {
    let value = this.parseUnary();

    if (this.matchOperator(['^'])) {
      const right = this.parseUnary();
      value = Math.pow(value, right);
    }

    return value;
  }

  private parseUnary(): number {
    if (this.matchOperator(['+', '-'])) {
      const op = this.previousOperator()!;
      const value = this.parseUnary();
      return op === '-' ? -value : value;
    }

    return this.parseFactor();
  }

  private parseFactor(): number {
    if (this.matchNumber()) {
      return this.previousNumber()!;
    }

    if (this.matchIdentifier('e')) {
      return Math.E;
    }

    if (this.matchIdentifier('pi')) {
      return Math.PI;
    }

    const toRadians = (x: number): number =>
      this.angleMode === 'deg' ? (x * Math.PI) / 180 : x;

    const functions: Record<string, (x: number) => number> = {
      sin: (x: number) => Math.sin(toRadians(x)),
      cos: (x: number) => Math.cos(toRadians(x)),
      tan: (x: number) => Math.tan(toRadians(x)),
      log: (x: number) => {
        if (x <= 0) {
          throw new Error('Invalid log argument');
        }
        return Math.log10(x);
      },
      ln: (x: number) => {
        if (x <= 0) {
          throw new Error('Invalid ln argument');
        }
        return Math.log(x);
      },
      sqrt: (x: number) => {
        if (x < 0) {
          throw new Error('Invalid sqrt argument');
        }
        return Math.sqrt(x);
      },
    };

    for (const [name, fn] of Object.entries(functions)) {
      if (this.matchIdentifier(name)) {
        this.consume('lparen');
        const arg = this.parseExpression();
        this.consume('rparen');
        return fn(arg);
      }
    }

    if (this.match('lparen')) {
      const value = this.parseExpression();
      this.consume('rparen');
      return value;
    }

    throw new Error('Unexpected token');
  }

  private match(type: Token['type']): boolean {
    if (this.index >= this.tokens.length) {
      return false;
    }
    if (this.tokens[this.index].type !== type) {
      return false;
    }
    this.index++;
    return true;
  }

  private matchOperator(values: string[]): boolean {
    if (this.index >= this.tokens.length) {
      return false;
    }
    const token = this.tokens[this.index];
    if (token.type !== 'operator' || !values.includes(token.value)) {
      return false;
    }
    this.index++;
    return true;
  }

  private matchNumber(): boolean {
    if (this.index >= this.tokens.length) {
      return false;
    }
    if (this.tokens[this.index].type !== 'number') {
      return false;
    }
    this.index++;
    return true;
  }

  private matchIdentifier(name: string): boolean {
    if (this.index >= this.tokens.length) {
      return false;
    }
    const token = this.tokens[this.index];
    if (token.type !== 'identifier' || token.name !== name) {
      return false;
    }
    this.index++;
    return true;
  }

  private consume(type: Token['type']): void {
    if (!this.match(type)) {
      throw new Error(`Expected ${type}`);
    }
  }

  private previousOperator(): string | null {
    const token = this.tokens[this.index - 1];
    return token.type === 'operator' ? token.value : null;
  }

  private previousNumber(): number | null {
    const token = this.tokens[this.index - 1];
    return token.type === 'number' ? token.value : null;
  }
}
