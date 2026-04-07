import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { Doctor } from '../../models/health.models';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HealthNavbarComponent],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.css'
})
export class DoctorListComponent implements OnInit {
  allDoctors = signal<Doctor[]>([]);
  isLoading  = signal(true);
  loadError  = signal('');
  showFilters = signal(false);

  // Filters
  searchQuery = signal('');
  selectedSpecialty = signal('all');
  selectedCity = signal('all');
  selectedType = signal('all');
  minRating = signal(0);
  maxFee = signal(1000);
  availableToday = signal(false);
  sortBy = signal<'rating' | 'fee_asc' | 'fee_desc' | 'experience'>('rating');

  specialties = [
    { key: 'all', label: 'All Specialties' },
    { key: 'cardiology', label: 'Cardiology' },
    { key: 'neurology', label: 'Neurology' },
    { key: 'dermatology', label: 'Dermatology' },
    { key: 'general', label: 'General Practice' },
    { key: 'pediatrics', label: 'Pediatrics' },
    { key: 'orthopedics', label: 'Orthopedics' },
    { key: 'psychiatry', label: 'Psychiatry' },
    { key: 'pulmonology', label: 'Pulmonology' },
  ];

  cities = ['all', 'Cairo', 'Alexandria', 'Giza'];
  ratingOptions = [{ val: 0, label: 'Any Rating' }, { val: 4, label: '4+' }, { val: 4.5, label: '4.5+' }, { val: 4.8, label: '4.8+' }];

  filteredDoctors = computed(() => {
    const q = this.searchQuery().toLowerCase();
    let docs = this.allDoctors().filter(d => {
      const matchQ = !q || d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.clinicName.toLowerCase().includes(q);
      const matchSpec = this.selectedSpecialty() === 'all' || d.specialtyKey === this.selectedSpecialty();
      const matchCity = this.selectedCity() === 'all' || d.city === this.selectedCity();
      const matchType = this.selectedType() === 'all' || (this.selectedType() === 'online' && d.online);
      const matchRating = d.rating >= this.minRating();
      const matchFee = d.consultationFee <= this.maxFee();
      const matchToday = !this.availableToday() || d.nextAvailable === 'Today';
      return matchQ && matchSpec && matchCity && matchType && matchRating && matchFee && matchToday;
    });

    // Sort
    switch (this.sortBy()) {
      case 'rating':     docs = [...docs].sort((a, b) => b.rating - a.rating); break;
      case 'fee_asc':    docs = [...docs].sort((a, b) => a.consultationFee - b.consultationFee); break;
      case 'fee_desc':   docs = [...docs].sort((a, b) => b.consultationFee - a.consultationFee); break;
      case 'experience': docs = [...docs].sort((a, b) => b.experience - a.experience); break;
    }
    return docs;
  });

  hasActiveFilters = computed(() =>
    this.selectedSpecialty() !== 'all' || this.selectedCity() !== 'all' ||
    this.selectedType() !== 'all' || this.minRating() > 0 || this.availableToday()
  );

  constructor(private dataService: HealthDataService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['specialty']) this.selectedSpecialty.set(params['specialty']);
      if (params['city'])      this.selectedCity.set(params['city']);
      if (params['q'])         this.searchQuery.set(params['q']);
    });
    this.dataService.getDoctors().subscribe({
      next: docs => {
        this.allDoctors.set(docs);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load doctors. Please check your connection and try again.');
        this.isLoading.set(false);
      },
    });
  }

  clearFilters() {
    this.selectedSpecialty.set('all');
    this.selectedCity.set('all');
    this.selectedType.set('all');
    this.minRating.set(0);
    this.maxFee.set(1000);
    this.availableToday.set(false);
    this.searchQuery.set('');
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.floor(r) ? 1 : 0); }
}
