import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FAQ_DATA } from '../../core/models/faq.model';
import { FaqComponent } from './faq.component';

describe('FaqComponent', () => {
  let fixture: ComponentFixture<FaqComponent>;
  let component: FaqComponent;

  const allQuestions = FAQ_DATA.flatMap((category) => category.items);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getTrigger(itemId: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      `#faq-trigger-${itemId}`,
    ) as HTMLButtonElement;
  }

  function getAnswer(itemId: string): HTMLElement {
    return fixture.nativeElement.querySelector(`#faq-answer-${itemId}`) as HTMLElement;
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the hero and all FAQ questions', () => {
    expect(fixture.nativeElement.querySelector('.faq-page')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.faq-hero')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.hero-eyebrow')?.textContent?.trim()).toBe(
      'Help center',
    );
    expect(fixture.nativeElement.querySelector('#faq-heading')?.textContent?.trim()).toBe(
      'Frequently asked questions',
    );
    expect(fixture.nativeElement.querySelector('.hero-lede')?.textContent).toContain(
      'Jarvis Enterprise',
    );

    for (const item of allQuestions) {
      expect(getTrigger(item.id)).toBeTruthy();
      expect(getTrigger(item.id).textContent).toContain(item.question);
    }
  });

  it('toggles aria-expanded and answer visibility when a question is clicked', () => {
    const firstItem = allQuestions[0];
    const trigger = getTrigger(firstItem.id);
    const answer = getAnswer(firstItem.id);

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(answer.hidden).toBe(true);

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(answer.hidden).toBe(false);
    expect(answer.textContent).toContain(firstItem.answer);

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(answer.hidden).toBe(true);
  });

  it('allows multiple questions to stay open at once', () => {
    const first = allQuestions[0];
    const second = allQuestions[1];
    const firstTrigger = getTrigger(first.id);
    const secondTrigger = getTrigger(second.id);

    firstTrigger.click();
    secondTrigger.click();
    fixture.detectChanges();

    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(getAnswer(first.id).hidden).toBe(false);
    expect(getAnswer(second.id).hidden).toBe(false);
  });

  it('links the support CTA to settings', () => {
    const cta = fixture.nativeElement.querySelector('.faq-cta .btn-primary') as HTMLAnchorElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('href')).toBe('/settings');
    expect(cta.textContent?.trim()).toBe('Go to Settings');
  });
});
