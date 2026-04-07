import { Component, signal, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChatNavbarComponent } from '../../components/chat-navbar/chat-navbar.component';

@Component({
  selector: 'app-chatbot-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, ChatNavbarComponent],
  templateUrl: './chatbot-landing.component.html',
  styleUrl: './chatbot-landing.component.css'
})
export class ChatbotLandingComponent implements OnInit, AfterViewInit {
  typedText = signal('');
  private phrases = ['Multilingual AI Assistant', 'Smart Help Platform', 'Intelligent Chatbot', '24/7 Support System'];
  private phraseIndex = 0;
  private charIndex = 0;
  private isDeleting = false;

  features = [
    { icon: 'fa-globe', title: 'Multilingual Support', desc: 'Communicate in 20+ languages. Our AI detects and responds in your preferred language automatically.', color: '#ef4444' },
    { icon: 'fa-bolt', title: 'Instant Responses', desc: 'Get answers in under 2 seconds. Powered by state-of-the-art language models for lightning-fast replies.', color: '#f97316' },
    { icon: 'fa-shield-halved', title: 'Enterprise Security', desc: 'End-to-end encryption, GDPR compliant, and SOC 2 certified. Your data is always protected.', color: '#8b5cf6' },
    { icon: 'fa-brain', title: 'AI-Powered Intelligence', desc: 'Continuously learning from interactions to provide increasingly accurate and helpful responses.', color: '#06b6d4' },
    { icon: 'fa-chart-line', title: 'Advanced Analytics', desc: 'Detailed insights into user behavior, conversation trends, and satisfaction metrics.', color: '#10b981' },
    { icon: 'fa-plug', title: 'Easy Integration', desc: 'Simple API and SDK for seamless integration into any website, app, or platform in minutes.', color: '#f59e0b' },
  ];

  stats = [
    { value: '10M+', label: 'Messages Processed' },
    { value: '50+', label: 'Languages Supported' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '< 2s', label: 'Avg Response Time' },
  ];

  testimonials = [
    { name: 'Sarah Johnson', role: 'CTO, TechCorp', text: 'NexusAI transformed our customer support. Response times dropped by 80% and satisfaction scores hit an all-time high.', avatar: 'SJ' },
    { name: 'Ahmed Hassan', role: 'Product Manager, StartupX', text: 'The multilingual capability is incredible. We now serve customers in 15 countries without hiring additional staff.', avatar: 'AH' },
    { name: 'Emma Wilson', role: 'CEO, RetailPlus', text: 'Integration took less than an hour. The ROI was visible within the first week of deployment.', avatar: 'EW' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() { if (isPlatformBrowser(this.platformId)) this.typeEffect(); }
  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  private typeEffect() {
    if (!isPlatformBrowser(this.platformId)) return;
    const current = this.phrases[this.phraseIndex];
    if (this.isDeleting) {
      this.typedText.set(current.substring(0, this.charIndex - 1));
      this.charIndex--;
    } else {
      this.typedText.set(current.substring(0, this.charIndex + 1));
      this.charIndex++;
    }
    if (!this.isDeleting && this.charIndex === current.length) {
      setTimeout(() => { this.isDeleting = true; this.typeEffect(); }, 2000);
      return;
    }
    if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
    }
    setTimeout(() => this.typeEffect(), this.isDeleting ? 60 : 100);
  }

  private observeElements() {
    if (!isPlatformBrowser(this.platformId)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }
}
