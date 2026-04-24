import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientDoctorService, Doctor } from '../../services/patient-doctor.service';

@Component({
  selector: 'app-patient-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-doctor-list.component.html',
  styleUrls: ['./patient-doctor-list.component.css']
})
export class PatientDoctorListComponent implements OnInit {
  private doctorService = inject(PatientDoctorService);
  private router = inject(Router);

  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  loading = false;
  error = '';

  // Filter properties
  searchQuery = '';
  selectedSpecialty = '';
  minRating = 0;
  specialties: string[] = [
    'General Practice',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Pulmonology',
    'Psychiatry'
  ];

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getDoctorList().subscribe({
      next: (data) => {
        this.doctors = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load doctors. Please try again.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesSearch = !this.searchQuery || 
        doctor.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesSpecialty = !this.selectedSpecialty || 
        doctor.specialty === this.selectedSpecialty;
      
      const matchesRating = doctor.rating >= this.minRating;

      return matchesSearch && matchesSpecialty && matchesRating;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSpecialtyChange(): void {
    this.applyFilters();
  }

  onRatingChange(): void {
    this.applyFilters();
  }

  viewDoctorProfile(doctorId: string): void {
    this.router.navigate(['/patient/doctor-profile', doctorId]);
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}
