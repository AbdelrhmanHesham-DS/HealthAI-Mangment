import { Component, signal, computed, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HealthNavbarComponent } from '../../../health/components/health-navbar/health-navbar.component';
import { MarkdownToHtmlPipe } from '../../../../shared/pipes/markdown-to-html.pipe';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: string;
}

@Component({
  selector: 'app-advanced-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HealthNavbarComponent, MarkdownToHtmlPipe],
  templateUrl: './advanced-chatbot.component.html',
  styleUrl: './advanced-chatbot.component.css'
})
export class AdvancedChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages = signal<Message[]>([]);
  inputMessage = signal('');
  isLoading = signal(false);
  showSidebar = signal(true);
  
  conversationHistory = computed(() => 
    this.messages().map(m => ({ role: m.role, content: m.content }))
  );

  suggestedQuestions = [
    '🏥 How do I book an appointment?',
    '👨‍⚕️ How do I find a specialist?',
    '🩺 What should I do about my symptoms?',
    '💊 Tell me about medications',
    '📋 How do I access my medical records?'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Add welcome message
    this.addMessage({
      id: this.generateId(),
      role: 'assistant',
      content: `👋 **Hey there!**

I'm MediAI, your healthcare assistant. I'm here to chat with you about anything health-related - whether it's symptoms, medications, appointments, or just general wellness questions.

Think of me like ChatGPT, but specialized for healthcare. I'll ask you questions to understand what you need, and we can have a real conversation about your health.

**What can I help you with today?**`,
      timestamp: new Date().toISOString(),
      type: 'welcome'
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    const message = this.inputMessage().trim();
    if (!message) return;

    // Add user message
    this.addMessage({
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    this.inputMessage.set('');
    this.isLoading.set(true);

    // Send to Python Flask backend (HealthAI Chatbot)
    this.http.post<any>('http://localhost:5000/api/chatbot/message', {
      message,
      history: this.conversationHistory()
    }).subscribe({
      next: (response) => {
        this.addMessage({
          id: this.generateId(),
          role: 'assistant',
          content: response.response || response.message || 'I received your message but couldn\'t generate a response.',
          timestamp: new Date().toISOString(),
          type: response.type
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Chat error:', error);
        this.addMessage({
          id: this.generateId(),
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error'
        });
        this.isLoading.set(false);
      }
    });
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  useSuggestedQuestion(question: string) {
    this.inputMessage.set(question);
    setTimeout(() => this.sendMessage(), 100);
  }

  clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.messages.set([]);
      this.ngOnInit();
    }
  }

  private addMessage(message: Message) {
    this.messages.update(msgs => [...msgs, message]);
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  toggleSidebar() {
    this.showSidebar.update(v => !v);
  }
}
