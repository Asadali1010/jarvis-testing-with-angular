import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  const setup = async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector('button') as HTMLButtonElement;
    return { fixture, root, toggle };
  };

  it('renders one link per nav item, and the account card points at the profile', async () => {
    const { root, fixture } = await setup();
    const links = Array.from(root.querySelectorAll('nav a'));

    expect(links.map(a => a.getAttribute('href'))).toEqual([
      '/dashboard',
      '/analytics',
      '/users',
      '/settings',
    ]);
    expect(root.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(fixture.componentInstance.user.email).toBe('john.doe@example.com');
  });

  it('shows labels when expanded and no redundant tooltips', async () => {
    const { root } = await setup();

    expect(root.textContent).toContain('Dashboard');
    expect(root.querySelector('nav a')!.getAttribute('title')).toBeNull();
    expect(root.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('replaces labels with tooltips when collapsed so icons stay identifiable', async () => {
    const { root, toggle, fixture } = await setup();

    toggle.click();
    await fixture.whenStable();

    expect(root.textContent).not.toContain('Dashboard');
    expect(
      Array.from(root.querySelectorAll('nav a')).map(a => a.getAttribute('title'))
    ).toEqual(['Dashboard', 'Analytics', 'Users', 'Settings']);
    expect(root.querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('button')!.getAttribute('aria-label')).toBe('Expand sidebar');
  });

  it('zeroes the list indent that Bootstrap\'s unlayered reboot applies to ul', async () => {
    const { root } = await setup();
    const list = root.querySelector('nav ul') as HTMLElement;

    // Global styles (Bootstrap) are not loaded in TestBed, so this pins that the
    // component's own reset is present and applied — without it jsdom reports ''.
    // The precedence over Bootstrap's bare `ul` rule comes from Angular's
    // `ul[_ngcontent-*]` scoping, both being unlayered.
    expect(getComputedStyle(list).paddingLeft).toBe('0px');
    expect(getComputedStyle(list).marginLeft).toBe('0px');
  });

  it('drops the edge bar when collapsed so it cannot collide with the centred icon', async () => {
    const { root, toggle, fixture } = await setup();
    const bars = () => root.querySelectorAll('nav a > span[class*="absolute"]');

    // Nothing is active in this harness, so force the expanded/collapsed geometry
    // check on the item classes themselves.
    const firstLink = () => root.querySelector('nav a') as HTMLElement;
    expect(firstLink().className).toContain('px-3');
    expect(firstLink().className).not.toContain('mx-auto');

    toggle.click();
    await fixture.whenStable();

    // Collapsed items become a centred square target, not a full-width row.
    expect(firstLink().className).toContain('mx-auto');
    expect(firstLink().className).toContain('justify-center');
    expect(firstLink().className).not.toContain('px-3');
    expect(bars().length).toBe(0);
  });
});
