import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../Auth/services/auth-service.service';
import { HealthDataService } from '../../features/health/services/health-data.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private auth        = inject(AuthService);
  private dataService = inject(HealthDataService);

  private socket: any = null;
  notification$ = new Subject<{ title: string; message: string; type: string }>();

  connect() {
    if (this.socket?.connected) return;
    if (!this.auth.isAuthenticated()) return;

    try {
      const { io } = require('socket.io-client');
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        // Register this user's socket with the server
        const userId = this.auth.currentUser?.id || this.auth.currentUser?._id;
        if (userId) this.socket.emit('register', userId);
      });

      this.socket.on('notification', (data: any) => {
        // Push to notification stream
        this.notification$.next(data);
        // Also update the notifications signal so navbar badge updates
        this.dataService.notifications.update(list => [{
          id: Date.now().toString(),
          title: data.title,
          message: data.message,
          type: data.type,
          read: false,
          createdAt: new Date().toISOString(),
        } as any, ...list]);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
      });

    } catch (err) {
      console.warn('[Socket] socket.io-client not available');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy() { this.disconnect(); }
}
