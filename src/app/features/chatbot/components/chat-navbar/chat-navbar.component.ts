import { Component, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-chat-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './chat-navbar.component.html',
  styleUrl: './chat-navbar.component.css'
})
export class ChatNavbarComponent {
  isScrolled = signal(false);
  isMobileOpen = signal(false);

  navLinks = [
    { label: 'Home', path: '/chatbot' },
    { label: 'Chat', path: '/chatbot/chat' },
    { label: 'Help Center', path: '/chatbot/help' },
    { label: 'Contact', path: '/chatbot/contact' },
    { label: 'Dashboard', path: '/chatbot/dashboard' },
  ];

  constructor(public theme: ThemeService, public auth: AuthService) {}

  @HostListener('window:scroll')
  onScroll() { this.isScrolled.set(window.scrollY > 20); }

  toggleMobile() { this.isMobileOpen.update(v => !v); }

  get userInitials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
