import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private themeService = inject(ThemeService);
  
  appTitle = 'Jarvis AI';
  notificationsCount = 5;
  userName = 'John Doe';
  userAvatar = 'https://i.pravatar.cc/150?u=john';

  get isDarkMode() {
    return this.themeService.theme() === 'dark';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
