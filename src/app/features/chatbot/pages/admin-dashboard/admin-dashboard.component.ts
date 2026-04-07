import { Component, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatNavbarComponent } from '../../components/chat-navbar/chat-navbar.component';
import { ToastComponent } from '../../components/toast/toast.component';
import { ChatService } from '../../services/chat.service';
import { ChatUser, AnalyticsData } from '../../models/chat.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatNavbarComponent, ToastComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  activeNav = signal('overview');
  users = signal<ChatUser[]>([]);
  analytics = signal<AnalyticsData | null>(null);
  isSidebarOpen = signal(true);
  searchQuery = signal('');

  activeNavLabel = computed(() => this.navItems.find(n => n.id === this.activeNav())?.label ?? '');

  navItems = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { id: 'users', icon: 'fa-users', label: 'Users' },
    { id: 'chats', icon: 'fa-comments', label: 'Chats' },
    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { id: 'settings', icon: 'fa-gear', label: 'Settings' },
  ];

  recentChats = [
    { user: 'Ahmed Hassan', message: 'How do I reset my password?', time: '2m ago', lang: '🇸🇦', status: 'resolved' },
    { user: 'Sarah Johnson', message: 'What are the pricing plans?', time: '5m ago', lang: '🇺🇸', status: 'active' },
    { user: 'Emma Wilson', message: 'API integration documentation', time: '12m ago', lang: '🇬🇧', status: 'resolved' },
    { user: 'Carlos Rivera', message: 'Billing issue with subscription', time: '18m ago', lang: '🇪🇸', status: 'pending' },
    { user: 'Fatima Zahra', message: 'Feature request for dark mode', time: '25m ago', lang: '🇲🇦', status: 'resolved' },
  ];

  constructor(
    private chatService: ChatService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.chatService.getAnalytics().subscribe(data => {
      this.analytics.set(data);
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.renderChart(), 300);
    }
  }

  private async renderChart() {
    if (!this.chartCanvas) return;
    try {
      const { Chart, registerables } = await import('chart.js/auto');
      Chart.register(...registerables);
      const data = this.analytics()?.dailyChats || [];
      const labels = data.map((_, i) => `Day ${i + 1}`);
      new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Chats',
            data,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } }
          }
        }
      });
    } catch (e) { console.warn('Chart.js not available'); }
  }

  get filteredUsers() {
    const q = this.searchQuery().toLowerCase();
    return this.users().filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  setNav(id: string) {
    this.activeNav.set(id);
    if (id === 'analytics' && isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.renderChart(), 200);
    }
  }

  deleteUser(id: string) {
    this.users.update(u => u.filter(x => x.id !== id));
    this.chatService.showToast('User removed', 'success');
  }
}
