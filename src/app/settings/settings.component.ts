import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../theme.service';

export interface SettingSection {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  public activeSection = signal<string>('profile');
  
  public sections: SettingSection[] = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'account', label: 'Account', icon: 'shield' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
  ];

  constructor(public themeService: ThemeService) {}

  public setActiveSection(id: string): void {
    this.activeSection.set(id);
  }
}
