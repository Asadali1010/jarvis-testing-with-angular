import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let fixture: ComponentFixture<CalculatorComponent>;
  let component: CalculatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function clickButton(value: string): void {
    const button = component.buttons.find((b) => b.value === value);
    expect(button).toBeTruthy();
    component.onButtonClick(button!);
    fixture.detectChanges();
  }

  function readoutText(): string {
    return fixture.nativeElement
      .querySelector('.calculator-readout')
      ?.textContent?.trim();
  }

  function errorText(): string | undefined {
    return fixture.nativeElement
      .querySelector('.calculator-error')
      ?.textContent?.trim();
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.calculator-page')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.header-copy')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.header-eyebrow')?.textContent?.trim()).toBe('Tools');
    expect(fixture.nativeElement.querySelector('#calculator-heading')?.textContent?.trim()).toBe(
      'Calculator',
    );
    expect(
      fixture.nativeElement.querySelector('.header-copy p:last-of-type')?.textContent?.trim(),
    ).toBe('Perform basic and scientific calculations.');
    expect(fixture.nativeElement.querySelector('.calculator-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.calc-angle-toggle')?.textContent?.trim()).toBe(
      'DEG',
    );
    expect(fixture.nativeElement.querySelector('#calculator-keys')).toBeTruthy();
    expect(readoutText()).toBe('0');
  });

  it('evaluates a scientific expression: sin(0) = 0', () => {
    clickButton('sin(');
    clickButton('0');
    clickButton(')');
    clickButton('equals');

    expect(component.error()).toBeNull();
    expect(component.result()).toBe('0');
    expect(readoutText()).toBe('0');
  });

  it('evaluates a scientific expression: sqrt(4) = 2', () => {
    clickButton('√(');
    clickButton('4');
    clickButton(')');
    clickButton('equals');

    expect(component.error()).toBeNull();
    expect(component.result()).toBe('2');
    expect(readoutText()).toBe('2');
  });

  it('shows an error for invalid input', () => {
    clickButton('sin(');
    clickButton('equals');

    expect(component.error()).toBe('Invalid expression');
    expect(component.result()).toBeNull();
    expect(errorText()).toBe('Invalid expression');
  });

  it('clears the display when Clear is pressed', () => {
    clickButton('5');
    clickButton('clear');

    expect(component.expression()).toBe('');
    expect(component.error()).toBeNull();
    expect(component.result()).toBeNull();
    expect(readoutText()).toBe('0');
  });

  it('starts a fresh expression after evaluation when a digit is entered', () => {
    clickButton('2');
    clickButton('+');
    clickButton('2');
    clickButton('equals');
    clickButton('5');

    expect(component.result()).toBeNull();
    expect(component.expression()).toBe('5');
    expect(readoutText()).toBe('5');
  });

  it('chains operators from the prior result after evaluation', () => {
    clickButton('2');
    clickButton('+');
    clickButton('2');
    clickButton('equals');
    clickButton('+');
    clickButton('3');
    clickButton('equals');

    expect(component.error()).toBeNull();
    expect(component.result()).toBe('7');
    expect(readoutText()).toBe('7');
  });

  it('evaluates sin(90) as 1 in degree mode', () => {
    expect(component.angleMode()).toBe('deg');
    clickButton('sin(');
    clickButton('9');
    clickButton('0');
    clickButton(')');
    clickButton('equals');

    expect(component.error()).toBeNull();
    expect(component.result()).toBe('1');
  });

  it('toggles angle mode between DEG and RAD', () => {
    const toggle = fixture.nativeElement.querySelector(
      '.calc-angle-toggle',
    ) as HTMLButtonElement;

    expect(toggle).toBeTruthy();
    expect(toggle.textContent?.trim()).toBe('DEG');
    expect(component.angleMode()).toBe('deg');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.textContent?.trim()).toBe('RAD');
    expect(component.angleMode()).toBe('rad');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.textContent?.trim()).toBe('DEG');
    expect(component.angleMode()).toBe('deg');
  });
});
