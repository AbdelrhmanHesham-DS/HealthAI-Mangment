import { Routes } from '@angular/router';
import { ChatbotShellComponent } from './chatbot-shell/chatbot-shell.component';
import { authGuard } from '../../core/guards/auth.guard';

export const CHATBOT_ROUTES: Routes = [
  {
    path: '',
    component: ChatbotShellComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/chatbot-landing/chatbot-landing.component').then(m => m.ChatbotLandingComponent),
      },
      {
        path: 'chat',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/chat-page/chat-page.component').then(m => m.ChatPageComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/help-center/help-center.component').then(m => m.HelpCenterComponent),
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact-page/contact-page.component').then(m => m.ContactPageComponent),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        data: { role: 'admin' },
        loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'advanced',
        canActivate: [authGuard],
        loadComponent: () => import('./components/advanced-chatbot/advanced-chatbot.component').then(m => m.AdvancedChatbotComponent),
      },
    ],
  },
];
