import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupportTicketsComponent } from './support-tickets.component';

/** Waits past the 800ms simulated API delay in SupportTicketsComponent.fetchTickets(). */
const waitForFetch = () => new Promise(resolve => setTimeout(resolve, 1000));

describe('SupportTicketsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportTicketsComponent],
      // Match production: the app runs with zoneless change detection.
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('shows the loading state until the fetch resolves', async () => {
    const fixture = TestBed.createComponent(SupportTicketsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fetching support tickets...');
  });

  // The fetch completes in a bare setTimeout, which zone.js is not around to patch.
  // Unless the state it writes is reactive, the spinner renders forever.
  it('renders the tickets once the fetch resolves', async () => {
    const fixture = TestBed.createComponent(SupportTicketsComponent);
    await fixture.whenStable();
    await waitForFetch();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Fetching support tickets...');
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('TICKET-1000');
  });

  it('pages the resolved tickets ten at a time', async () => {
    const fixture = TestBed.createComponent(SupportTicketsComponent);
    await fixture.whenStable();
    await waitForFetch();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('Showing 1 to 10 of 25 tickets');
  });

  it('narrows the table to matching tickets when the search term changes', async () => {
    const fixture = TestBed.createComponent(SupportTicketsComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();
    await waitForFetch();
    await fixture.whenStable();

    component.onSearchChange('TICKET-1007');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('TICKET-1007');
    expect(fixture.nativeElement.textContent).not.toContain('TICKET-1000');
  });

  it('shows the empty state when nothing matches the search term', async () => {
    const fixture = TestBed.createComponent(SupportTicketsComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();
    await waitForFetch();
    await fixture.whenStable();

    component.onSearchChange('no-such-ticket');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No tickets found');
    expect(fixture.nativeElement.querySelector('table')).toBeFalsy();
  });
});
