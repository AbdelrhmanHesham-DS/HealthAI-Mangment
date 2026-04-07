import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatNavbarComponent } from '../../components/chat-navbar/chat-navbar.component';
import { ToastComponent } from '../../components/toast/toast.component';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ChatNavbarComponent, ToastComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css'
})
export class ContactPageComponent {
  isSubmitting = signal(false);
  isSubmitted = signal(false);

  contactForm: FormGroup;

  contactInfo = [
    { icon: 'fa-envelope', label: 'Email', value: 'support@nexusai.com', color: '#ef4444' },
    { icon: 'fa-phone', label: 'Phone', value: '+1 (555) 000-0000', color: '#10b981' },
    { icon: 'fa-location-dot', label: 'Office', value: '123 AI Street, Tech City', color: '#8b5cf6' },
    { icon: 'fa-clock', label: 'Hours', value: '24/7 Support Available', color: '#f59e0b' },
  ];

  socialLinks = [
    { icon: 'fa-brands fa-twitter', label: 'Twitter', url: '#', color: '#1da1f2' },
    { icon: 'fa-brands fa-linkedin', label: 'LinkedIn', url: '#', color: '#0077b5' },
    { icon: 'fa-brands fa-github', label: 'GitHub', url: '#', color: '#fff' },
    { icon: 'fa-brands fa-discord', label: 'Discord', url: '#', color: '#5865f2' },
  ];

  constructor(private fb: FormBuilder, private chatService: ChatService) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.isSubmitted.set(true);
      this.chatService.showToast('Message sent successfully!', 'success');
      this.contactForm.reset();
    }, 1800);
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }
}
