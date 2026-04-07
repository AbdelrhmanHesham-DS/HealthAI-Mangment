import { Component, signal, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Doctor } from '../../models/health.models';

@Component({
  selector: 'app-health-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HealthNavbarComponent],
  templateUrl: './health-home.component.html',
  styleUrl: './health-home.component.css'
})
export class HealthHomeComponent implements OnInit, AfterViewInit {
  searchQuery = signal('');
  selectedCity = signal('all');
  selectedSpecialty = signal('all');
  featuredDoctors = signal<Doctor[]>([]);
  isLoadingDoctors = signal(true);

  cities = ['Cairo', 'Alexandria', 'Giza'];

  specialties = [
    { key: 'cardiology',   label: 'Cardiology',   icon: 'fa-heart-pulse',   color: '#ef4444' },
    { key: 'neurology',    label: 'Neurology',    icon: 'fa-brain',         color: '#8b5cf6' },
    { key: 'dermatology',  label: 'Dermatology',  icon: 'fa-hand-dots',     color: '#f59e0b' },
    { key: 'pediatrics',   label: 'Pediatrics',   icon: 'fa-baby',          color: '#06b6d4' },
    { key: 'orthopedics',  label: 'Orthopedics',  icon: 'fa-bone',          color: '#f97316' },
    { key: 'psychiatry',   label: 'Psychiatry',   icon: 'fa-head-side-virus', color: '#ec4899' },
    { key: 'pulmonology',  label: 'Pulmonology',  icon: 'fa-lungs',         color: '#10b981' },
    { key: 'general',      label: 'General',      icon: 'fa-stethoscope',   color: '#6366f1' },
    { key: 'dentistry',    label: 'Dentistry',    icon: 'fa-tooth',         color: '#0ea5e9' },
    { key: 'ophthalmology',label: 'Eye',          icon: 'fa-eye',           color: '#84cc16' },
  ];

  stats = [
    { value: '20,000+', label: 'Verified Doctors' },
    { value: '2M+',     label: 'Patients Served' },
    { value: '50+',     label: 'Specialties' },
    { value: '4.8★',    label: 'Average Rating' },
  ];

  howItWorks = [
    { icon: 'fa-magnifying-glass', title: 'Search',       desc: 'Find doctors by specialty, name, or location' },
    { icon: 'fa-stethoscope',      title: 'MediAI',       desc: 'Describe symptoms — AI recommends the right specialist' },
    { icon: 'fa-calendar-check',   title: 'Book',         desc: 'Choose your preferred time slot instantly' },
    { icon: 'fa-heart-pulse',      title: 'Track Health', desc: 'Monitor vitals and get AI risk assessments' },
  ];

  constructor(
    private dataService: HealthDataService,
    private router: Router,
    public theme: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.dataService.getDoctors().subscribe({
      next: docs => {
        const sorted = [...docs].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        this.featuredDoctors.set(sorted.slice(0, 4));
        this.isLoadingDoctors.set(false);
      },
      error: () => {
        this.featuredDoctors.set([]);
        this.isLoadingDoctors.set(false);
      },
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const obs = new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
    document.querySelectorAll('.aos').forEach(el => obs.observe(el));
  }

  search() {
    this.router.navigate(['/health/doctors'], {
      queryParams: {
        q: this.searchQuery() || null,
        city: this.selectedCity() !== 'all' ? this.selectedCity() : null,
        specialty: this.selectedSpecialty() !== 'all' ? this.selectedSpecialty() : null,
      }
    });
  }

  searchBySpecialty(key: string) {
    this.router.navigate(['/health/doctors'], { queryParams: { specialty: key } });
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.floor(r) ? 1 : 0); }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  hidePhoto(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  showPhoto(e: Event): void {
    (e.target as HTMLImageElement).style.opacity = '1';
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#ef4444,#dc2626', '#6366f1,#8b5cf6', '#10b981,#059669',
      '#f59e0b,#d97706', '#06b6d4,#0891b2', '#ec4899,#db2777',
      '#8b5cf6,#7c3aed', '#f97316,#ea580c',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }
}
