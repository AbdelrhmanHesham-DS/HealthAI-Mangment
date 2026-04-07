import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthDataService } from '../../../health/services/health-data.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  isLoading = signal(true);

  constructor(public dataService: HealthDataService) {}

  ngOnInit() {
    this.dataService.getNotifications().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  markRead(id: string) {
    this.dataService.markNotificationRead(id).subscribe();
  }

  markAllRead() {
    this.dataService.markAllNotificationsRead().subscribe();
  }

  notifIcon(type: string): string {
    const map: Record<string, string> = {
      appointment: 'fa-regular fa-calendar',
      message: 'fa-solid fa-comment-medical',
      system: 'fa-solid fa-circle-info',
      reminder: 'fa-solid fa-bell',
    };
    return map[type] || 'fa-solid fa-bell';
  }
}
