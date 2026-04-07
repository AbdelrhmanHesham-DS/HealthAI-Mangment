import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, delay } from 'rxjs';
import { Conversation, FaqItem, AnalyticsData } from '../models/chat.model';
import { AuthService } from '../../../core/Auth/services/auth-service.service';

const API = 'http://localhost:3000/api/chat';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  toastMessage$ = new Subject<{ text: string; type: 'success' | 'error' | 'info' }>();

  getUserName(): string {
    return this.auth.currentUser?.name || 'Guest';
  }

  getUserInitials(): string {
    const name = this.auth.currentUser?.name || 'G';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  private readonly botResponses: Record<string, string[]> = {
    en: [
      "I'm here to help! Could you provide more details about your question?",
      "That's a great question. Based on my knowledge, I can assist you with that.",
      "I understand your concern. Let me provide you with the best answer I can.",
      "Thank you for reaching out! Here's what I know about that topic.",
      "I'm processing your request. Here's a comprehensive answer for you.",
    ],
    ar: [
      "أنا هنا للمساعدة! هل يمكنك تقديم مزيد من التفاصيل؟",
      "سؤال رائع. بناءً على معرفتي، يمكنني مساعدتك في ذلك.",
      "أفهم قلقك. دعني أقدم لك أفضل إجابة ممكنة.",
      "شكراً للتواصل! إليك ما أعرفه عن هذا الموضوع.",
      "أعالج طلبك. إليك إجابة شاملة لك.",
    ],
    fr: [
      "Je suis là pour vous aider! Pouvez-vous fournir plus de détails?",
      "C'est une excellente question. Je peux vous aider avec ça.",
      "Je comprends votre préoccupation. Voici la meilleure réponse que je puisse donner.",
      "Merci de nous avoir contactés! Voici ce que je sais sur ce sujet.",
      "Je traite votre demande. Voici une réponse complète pour vous.",
    ],
  };

  // ── Local helpers (used by chat-page & contact-page) ─────────────────────

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getBotResponse(lang: string = 'en'): Observable<string> {
    const responses = this.botResponses[lang] || this.botResponses['en'];
    const response = responses[Math.floor(Math.random() * responses.length)];
    return of(response).pipe(delay(1500 + Math.random() * 1000));
  }

  showToast(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage$.next({ text, type });
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${API}/conversations`);
  }

  createConversation(title?: string, language?: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${API}/conversations`, { title, language });
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${API}/conversations/${id}`);
  }

  sendMessage(conversationId: string, content: string): Observable<{ userMessage: any; botMessage: any }> {
    return this.http.post<{ userMessage: any; botMessage: any }>(
      `${API}/conversations/${conversationId}/messages`, { content }
    );
  }

  deleteConversation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/conversations/${id}`);
  }

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${API}/analytics`);
  }

  // ── FAQs (static) ─────────────────────────────────────────────────────────

  getFaqs(): FaqItem[] {
    return [
      { id: 1, category: 'General', question: 'What is this AI chatbot platform?', answer: 'Our AI Multilingual Chatbot is a cutting-edge conversational assistant. It supports multiple languages and can answer questions 24/7.' },
      { id: 2, category: 'General', question: 'Which languages are supported?', answer: 'We currently support English, Arabic, and French.' },
      { id: 3, category: 'Technical', question: 'How accurate are the responses?', answer: 'Our AI achieves over 95% accuracy on common queries.' },
      { id: 4, category: 'Technical', question: 'Is my data secure?', answer: 'All conversations are encrypted end-to-end. We follow GDPR compliance.' },
      { id: 5, category: 'Billing', question: 'Is there a free plan available?', answer: 'Yes! Our free plan includes 100 messages per month.' },
      { id: 6, category: 'Billing', question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel at any time with no cancellation fees.' },
      { id: 7, category: 'Technical', question: 'Can I integrate this into my website?', answer: 'Yes! We provide a REST API for seamless integration.' },
      { id: 8, category: 'General', question: 'How fast does the AI respond?', answer: 'Average response time is under 2 seconds.' },
    ];
  }
}
