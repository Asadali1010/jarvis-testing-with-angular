import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DEFAULT_APP_SETTINGS } from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let settingsService: SettingsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [SettingsService, provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' }],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getShellElement(): HTMLElement {
    return fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
  }

  function getMenuButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.menu-button') as HTMLButtonElement;
  }

  it('renders the responsive shell layout structure', () => {
    expect(getShellElement()).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-main')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#main-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-footer')).toBeTruthy();
  });

  it('toggles mobile navigation when the header menu button is clicked', () => {
    expect(component.mobileNavOpen()).toBe(false);

    getMenuButton().click();
    fixture.detectChanges();

    expect(component.mobileNavOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sidebar-backdrop')).toBeTruthy();

    getMenuButton().click();
    fixture.detectChanges();

    expect(component.mobileNavOpen()).toBe(false);
  });

  it('closes mobile navigation from the backdrop control', () => {
    component.toggleMobileNav();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      '.sidebar-backdrop',
    ) as HTMLButtonElement;
    expect(backdrop).toBeTruthy();
    expect(backdrop.getAttribute('aria-label')).toBe('Close navigation menu');

    backdrop.click();
    fixture.detectChanges();

    expect(component.mobileNavOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sidebar-backdrop')).toBeNull();
  });

  it('applies compact layout class when compact mode is enabled', () => {
    settingsService.updateAppearance({ compactMode: true });
    fixture.detectChanges();

    expect(getShellElement().classList.contains('app-shell--compact')).toBe(true);
  });

  it('applies no-animations class when animations are disabled', () => {
    settingsService.updateAppearance({ animationsEnabled: false });
    fixture.detectChanges();

    expect(getShellElement().classList.contains('app-shell--no-animations')).toBe(true);
  });

  it('reflects sidebar mobile open state on the sidebar component', () => {
    component.toggleMobileNav();
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector('app-sidebar');
    expect(sidebar).toBeTruthy();
    expect(component.mobileNavOpen()).toBe(true);
  });

  it('defaults to standard layout classes from settings', () => {
    expect(settingsService.appearance()).toEqual(DEFAULT_APP_SETTINGS.appearance);
    expect(getShellElement().classList.contains('app-shell--compact')).toBe(false);
    expect(getShellElement().classList.contains('app-shell--no-animations')).toBe(false);
  });
});
