import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';

interface Toast { id: number; text: string; type: 'success' | 'error' | 'info'; }

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.type">
          <i class="fa-solid" [class.fa-check-circle]="toast.type==='success'" [class.fa-circle-xmark]="toast.type==='error'" [class.fa-circle-info]="toast.type==='info'"></i>
          <span>{{ toast.text }}</span>
          <button (click)="remove(toast.id)"><i class="fa-solid fa-xmark"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; min-width: 280px; max-width: 380px; animation: slideIn 0.3s ease; box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
    .toast-success { background: #065f46; color: #6ee7b7; border: 1px solid #059669; }
    .toast-error { background: #7f1d1d; color: #fca5a5; border: 1px solid #ef4444; }
    .toast-info { background: #1e3a5f; color: #93c5fd; border: 1px solid #3b82f6; }
    .toast-item button { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; opacity: 0.7; padding: 0; }
    .toast-item button:hover { opacity: 1; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts = signal<Toast[]>([]);
  private sub!: Subscription;
  private counter = 0;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.sub = this.chatService.toastMessage$.subscribe(msg => {
      const id = ++this.counter;
      this.toasts.update(t => [...t, { id, ...msg }]);
      setTimeout(() => this.remove(id), 4000);
    });
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
