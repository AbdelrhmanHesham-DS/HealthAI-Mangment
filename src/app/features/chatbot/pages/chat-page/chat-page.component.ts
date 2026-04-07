import { Component, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatNavbarComponent } from '../../components/chat-navbar/chat-navbar.component';
import { ToastComponent } from '../../components/toast/toast.component';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/chat.model';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatNavbarComponent, ToastComponent],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css'
})
export class ChatPageComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  messages = signal<Message[]>([]);
  inputText = signal('');
  isTyping = signal(false);
  selectedLang = signal('en');
  isSidebarOpen = signal(false);
  shouldScroll = false;
  conversationId: string | null = null;

  languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  suggestions = [
    'What can you help me with?',
    'How do I get started?',
    'What languages do you support?',
    'Tell me about your features',
  ];

  conversationHistory: { title: string; time: string }[] = [];

  constructor(public chatService: ChatService) {}

  ngOnInit() {
    this.addWelcomeMessage();
    // Create a backend conversation for persistence
    this.chatService.createConversation('New Chat', this.selectedLang()).subscribe({
      next: conv => { this.conversationId = conv.id; },
      error: () => { /* fallback to local-only mode */ },
    });
    // Load past conversations for sidebar
    this.chatService.getConversations().subscribe({
      next: convs => {
        this.conversationHistory = convs.map(c => ({
          title: c.title,
          time: new Date(c.createdAt).toLocaleDateString(),
        }));
      },
      error: () => {},
    });
  }

  ngOnDestroy() {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private addWelcomeMessage() {
    const welcome: Message = {
      id: this.chatService.generateId(),
      content: "Hello! 👋 I'm NexusAI, your intelligent multilingual assistant. I can help you in English, Arabic, French, and many more languages. What can I help you with today?",
      role: 'bot',
      timestamp: new Date(),
    };
    this.messages.set([welcome]);
  }

  sendMessage(text?: string) {
    const content = (text || this.inputText()).trim();
    if (!content || this.isTyping()) return;

    const userMsg: Message = {
      id: this.chatService.generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    this.messages.update(m => [...m, userMsg]);
    this.inputText.set('');
    this.isTyping.set(true);
    this.shouldScroll = true;

    if (this.conversationId) {
      // Use real backend — messages are persisted in MongoDB
      this.chatService.sendMessage(this.conversationId, content).subscribe({
        next: res => {
          const botMsg: Message = {
            id: this.chatService.generateId(),
            content: res.botMessage.content,
            role: 'bot',
            timestamp: new Date(res.botMessage.timestamp),
          };
          this.messages.update(m => [...m, botMsg]);
          this.isTyping.set(false);
          this.shouldScroll = true;
        },
        error: () => this.fallbackResponse(),
      });
    } else {
      // Fallback if no conversation created (unauthenticated)
      this.chatService.getBotResponse(this.selectedLang()).subscribe({
        next: response => {
          const botMsg: Message = {
            id: this.chatService.generateId(),
            content: response,
            role: 'bot',
            timestamp: new Date(),
          };
          this.messages.update(m => [...m, botMsg]);
          this.isTyping.set(false);
          this.shouldScroll = true;
        },
        error: () => this.fallbackResponse(),
      });
    }
  }

  private fallbackResponse() {
    const errMsg: Message = {
      id: this.chatService.generateId(),
      content: "Sorry, I couldn't connect right now. Please try again.",
      role: 'bot',
      timestamp: new Date(),
    };
    this.messages.update(m => [...m, errMsg]);
    this.isTyping.set(false);
    this.shouldScroll = true;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    if (this.conversationId) {
      this.chatService.deleteConversation(this.conversationId).subscribe();
    }
    this.conversationId = null;
    this.messages.set([]);
    this.addWelcomeMessage();
    // Create a new conversation
    this.chatService.createConversation('New Chat', this.selectedLang()).subscribe({
      next: conv => { this.conversationId = conv.id; },
    });
    this.chatService.showToast('Chat cleared', 'info');
  }

  copyMessage(content: string) {
    navigator.clipboard.writeText(content);
    this.chatService.showToast('Copied to clipboard', 'success');
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  setLang(code: string) {
    this.selectedLang.set(code);
    this.chatService.showToast(`Language switched to ${this.languages.find(l => l.code === code)?.label}`, 'success');
  }
}
