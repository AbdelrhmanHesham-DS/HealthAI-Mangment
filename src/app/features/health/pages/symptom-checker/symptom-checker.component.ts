import { Component, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

const API     = 'http://localhost:3000/api/symptom';
const CASES_API = 'http://localhost:3000/api/cases';

interface ScMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'doctor-card' | 'result';
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  confidence?: number;
  source?: string;
  reasons?: string[];
  doctors?: any[];
  suggestions?: string[];
  streaming?: boolean;
  result?: any;
}

@Component({
  selector: 'app-symptom-checker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HealthNavbarComponent],
  templateUrl: './symptom-checker.component.html',
  styleUrl: './symptom-checker.component.css',
})
export class SymptomCheckerComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('msgEnd') msgEnd!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  private http = inject(HttpClient);
  public  auth = inject(AuthService);

  // ── Chat mode ──────────────────────────────────────────────────────────
  messages    = signal<ScMessage[]>([]);
  inputText   = signal('');
  isTyping    = signal(false);
  shouldScroll = false;
  sessionId: string | null = null;
  charCount   = signal(0);
  isListening = signal(false);

  // ── Mode toggle ────────────────────────────────────────────────────────
  mode = signal<'chat' | 'flow'>('chat');

  // ── Guided flow state ──────────────────────────────────────────────────
  flowSessionId: string | null = null;
  flowStep      = signal(0);
  flowTotal     = signal(6);
  flowQuestion  = signal('');
  flowKey       = signal('');
  flowAnswer    = signal('');
  flowDone      = signal(false);
  flowResult    = signal<any>(null);
  flowAnswers   = signal<Record<string, string>>({});
  flowLoading   = signal(false);

  // ── Saved cases ────────────────────────────────────────────────────────
  savedCases    = signal<any[]>([]);
  caseSaved     = signal(false);
  showCases     = signal(false);
  isDownloading = signal(false);

  quickSymptoms = [
    '🤕 Headache & dizziness',
    '💔 Chest pain',
    '🌡️ Fever & cough',
    '🦴 Joint or back pain',
    '😰 Anxiety & stress',
    '🤢 Stomach pain & nausea',
    '👁️ Eye problems',
    '🩺 General checkup',
  ];

  ngOnInit() {
    this.addWelcome();
    if (this.auth.isAuthenticated()) this.loadCases();
  }

  ngOnDestroy() {
    if (this.sessionId) this.http.post(`${API}/reset`, { sessionId: this.sessionId }).subscribe();
    if (this.flowSessionId) this.http.post(`${API}/flow/reset`, { sessionId: this.flowSessionId }).subscribe();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.msgEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  // ── Mode switching ─────────────────────────────────────────────────────
  switchMode(m: 'chat' | 'flow') {
    this.mode.set(m);
    if (m === 'flow') this.startFlow();
    else { this.messages.set([]); this.addWelcome(); }
  }

  // ── Chat mode ──────────────────────────────────────────────────────────
  private addWelcome() {
    this.messages.set([{
      id: this.uid(), role: 'bot', timestamp: new Date(), type: 'text',
      text: "Hello! 👋 I'm your **AI Health Assistant**.\n\nDescribe your symptoms in detail and I'll analyze them, identify possible conditions, and recommend the right specialist.\n\nYou can also switch to **Guided Mode** for a step-by-step triage.\n\n⚠️ *For informational purposes only. Not a substitute for professional medical advice.*",
      suggestions: this.quickSymptoms.slice(0, 4),
    }]);
  }

  send(text?: string) {
    const content = (text || this.inputText()).trim();
    if (!content || this.isTyping()) return;
    this.messages.update(m => [...m, { id: this.uid(), role: 'user', text: content, timestamp: new Date() }]);
    this.inputText.set(''); this.charCount.set(0);
    this.isTyping.set(true); this.shouldScroll = true;
    const botId = this.uid();
    this.messages.update(m => [...m, { id: botId, role: 'bot', text: '', timestamp: new Date(), streaming: true }]);
    this.http.post<any>(`${API}/chat`, { message: content, sessionId: this.sessionId }).subscribe({
      next: res => { this.sessionId = res.sessionId; this.streamText(botId, res); },
      error: () => { this.updateMessage(botId, { text: "Connection error. Please try again.", streaming: false }); this.isTyping.set(false); },
    });
  }

  private streamText(botId: string, res: any) {
    const fullText = res.text || '';
    let i = 0;
    const interval = setInterval(() => {
      i += Math.ceil(fullText.length / 80);
      this.updateMessage(botId, { text: fullText.substring(0, Math.min(i, fullText.length)), streaming: i < fullText.length });
      this.shouldScroll = true;
      if (i >= fullText.length) {
        clearInterval(interval);
        this.updateMessage(botId, { text: fullText, type: res.type || 'text', urgency: res.urgency, confidence: res.confidence, source: res.source, reasons: res.reasons || [], doctors: res.doctors || [], suggestions: res.suggestions || [], streaming: false });
        this.isTyping.set(false); this.shouldScroll = true;
      }
    }, fullText.length > 300 ? 8 : 15);
  }

  private updateMessage(id: string, patch: Partial<ScMessage>) {
    this.messages.update(list => list.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  clearChat() {
    if (this.sessionId) { this.http.post(`${API}/reset`, { sessionId: this.sessionId }).subscribe(); this.sessionId = null; }
    this.messages.set([]); this.addWelcome();
  }

  // ── Guided flow ────────────────────────────────────────────────────────
  startFlow() {
    this.flowDone.set(false); this.flowResult.set(null);
    this.flowAnswers.set({}); this.flowAnswer.set('');
    this.flowSessionId = null;
    this.flowLoading.set(true);
    this.http.post<any>(`${API}/flow`, {}).subscribe({
      next: res => {
        this.flowSessionId = res.sessionId;
        this.flowStep.set(res.step);
        this.flowTotal.set(res.totalSteps);
        this.flowQuestion.set(res.question);
        this.flowKey.set(res.key);
        this.flowLoading.set(false);
      },
      error: () => this.flowLoading.set(false),
    });
  }

  nextFlowStep() {
    const answer = this.flowAnswer().trim();
    if (!answer) return;
    this.flowAnswers.update(a => ({ ...a, [this.flowKey()]: answer }));
    this.flowLoading.set(true);
    this.http.post<any>(`${API}/flow`, { answer, sessionId: this.flowSessionId }).subscribe({
      next: res => {
        this.flowLoading.set(false);
        this.flowAnswer.set('');
        if (res.done) {
          this.flowDone.set(true);
          this.flowResult.set(res.result);
          this.flowAnswers.set(res.answers || this.flowAnswers());
        } else {
          this.flowStep.set(res.step);
          this.flowQuestion.set(res.question);
          this.flowKey.set(res.key);
        }
      },
      error: () => this.flowLoading.set(false),
    });
  }

  restartFlow() {
    if (this.flowSessionId) this.http.post(`${API}/flow/reset`, { sessionId: this.flowSessionId }).subscribe();
    this.startFlow();
  }

  get flowProgress(): number {
    return this.flowTotal() > 0 ? Math.round((this.flowStep() / this.flowTotal()) * 100) : 0;
  }

  // ── Saved cases ────────────────────────────────────────────────────────
  loadCases() {
    this.http.get<any[]>(CASES_API).subscribe({ next: c => this.savedCases.set(c), error: () => {} });
  }

  saveCurrentCase() {
    const result = this.flowResult();
    if (!result || !this.auth.isAuthenticated()) return;
    const title = result.condition || 'Symptom Case';
    this.http.post<any>(CASES_API, {
      title,
      answers: this.flowAnswers(),
      result,
      mode: 'flow',
    }).subscribe({
      next: c => {
        this.savedCases.update(list => [c, ...list]);
        this.caseSaved.set(true);
        setTimeout(() => this.caseSaved.set(false), 3000);
      },
    });
  }

  saveChatCase() {
    if (!this.auth.isAuthenticated()) return;
    const lastBotMsg = [...this.messages()].reverse().find(m => m.role === 'bot' && m.urgency);
    if (!lastBotMsg) return;
    const title = lastBotMsg.type === 'doctor-card' ? (lastBotMsg.text.substring(0, 40) + '...') : 'Chat Consultation';
    this.http.post<any>(CASES_API, {
      title,
      answers: {},
      result: { urgency: lastBotMsg.urgency, confidence: lastBotMsg.confidence, source: lastBotMsg.source },
      mode: 'chat',
    }).subscribe({
      next: c => {
        this.savedCases.update(list => [c, ...list]);
        this.caseSaved.set(true);
        setTimeout(() => this.caseSaved.set(false), 3000);
      },
    });
  }

  deleteCase(id: string) {
    this.http.delete(`${CASES_API}/${id}`).subscribe({
      next: () => this.savedCases.update(list => list.filter(c => c.id !== id)),
    });
  }

  // ── Report download ────────────────────────────────────────────────────
  downloadReport(result: any, answers: Record<string, string> = {}, symptoms = '') {
    if (!this.auth.isAuthenticated()) return;
    this.isDownloading.set(true);
    this.http.post(`http://localhost:3000/api/report/generate`, {
      symptoms,
      condition:      result?.condition || '',
      urgency:        result?.urgency || 'low',
      specialty:      result?.specialty || '',
      specialtyKey:   result?.specialtyKey || 'general',
      recommendation: result?.recommendation || '',
      confidence:     result?.confidence || 0,
      source:         result?.source || '',
      reasons:        result?.reasons || [],
      answers,
      doctors:        result?.doctors || [],
      mode:           this.mode(),
    }, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `HealthAI-Report-${Date.now()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.isDownloading.set(false);
      },
      error: () => this.isDownloading.set(false),
    });
  }

  downloadChatReport() {
    const lastBotMsg = [...this.messages()].reverse().find(m => m.role === 'bot' && m.urgency);
    if (!lastBotMsg) return;
    const userMsgs = this.messages().filter(m => m.role === 'user').map(m => m.text).join('; ');
    this.downloadReport({
      urgency:    lastBotMsg.urgency,
      confidence: lastBotMsg.confidence,
      source:     lastBotMsg.source,
      reasons:    lastBotMsg.reasons,
      doctors:    lastBotMsg.doctors,
    }, {}, userMsgs);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  onKey(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } }
  onFlowKey(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); this.nextFlowStep(); } }

  onInput(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    this.inputText.set(val); this.charCount.set(val.length);
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  renderMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  formatTime(d: Date) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  formatDate(d: string) { return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

  urgencyColor(u?: string) {
    return u === 'emergency' ? '#ef4444' : u === 'high' ? '#f59e0b' : u === 'medium' ? '#6366f1' : '#10b981';
  }
  urgencyLabel(u?: string) {
    return u === 'emergency' ? '🚨 Emergency' : u === 'high' ? '⚠️ Urgent' : u === 'medium' ? '🟡 See Doctor Soon' : '🟢 Non-Urgent';
  }

  private uid() { return Math.random().toString(36).substr(2, 9); }

  get lastMessageRole(): string {
    const msgs = this.messages();
    return msgs.length > 0 ? msgs[msgs.length - 1].role : '';
  }

  toggleVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Try Chrome.'); return;
    }
    if (this.isListening()) { this.isListening.set(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    this.isListening.set(true); r.start();
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; this.inputText.set(t); this.charCount.set(t.length); this.isListening.set(false); };
    r.onerror = () => this.isListening.set(false);
    r.onend   = () => this.isListening.set(false);
  }
}
