import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatNavbarComponent } from '../../components/chat-navbar/chat-navbar.component';
import { ChatService } from '../../services/chat.service';
import { FaqItem } from '../../models/chat.model';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatNavbarComponent],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent {
  searchQuery = signal('');
  activeCategory = signal('All');
  faqs = signal<FaqItem[]>([]);

  categories = ['All', 'General', 'Technical', 'Billing'];

  suggestedQuestions = [
    'How to integrate the chatbot?',
    'What is the free plan limit?',
    'How to change language settings?',
    'Is my data encrypted?',
    'How to export chat history?',
    'Can I customize the bot personality?',
  ];

  filteredFaqs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.faqs().filter(f => {
      const matchCat = cat === 'All' || f.category === cat;
      const matchQ = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  constructor(private chatService: ChatService) {
    this.faqs.set(this.chatService.getFaqs());
  }

  toggleFaq(id: number) {
    this.faqs.update(items => items.map(f => ({ ...f, isOpen: f.id === id ? !f.isOpen : false })));
  }

  useSuggestion(q: string) {
    this.searchQuery.set(q);
  }
}
