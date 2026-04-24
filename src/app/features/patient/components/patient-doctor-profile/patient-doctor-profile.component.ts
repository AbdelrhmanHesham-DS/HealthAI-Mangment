import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientDoctorService, Doctor, Review, DoctorAvailability } from '../../services/patient-doctor.service';

@Component({
  selector: 'app-patient-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-doctor-profile.component.html',
  styleUrls: ['./patient-doctor-profile.component.css']
})
export class PatientDoctorProfileComponent implements OnInit {
  private doctorService = inject(PatientDoctorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  doctor: Doctor | null = null;
  availability: DoctorAvailability | null = null;
  reviews: Review[] = [];
  loading = false;
  error = '';

  // Booking form
  showBookingForm = false;
  selectedDate = '';
  selectedTime = '';
  availableSlots: any[] = [];

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('id');
    if (doctorId) {
      this.loadDoctorProfile(doctorId);
      this.loadDoctorAvailability(doctorId);
      this.loadDoctorReviews(doctorId);
    }
  }

  loadDoctorProfile(doctorId: string): void {
    this.loading = true;
    this.doctorService.getDoctorProfile(doctorId).subscribe({
      next: (data) => {
        this.doctor = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load doctor profile.';
        this.loading = false;
      }
    });
  }

  loadDoctorAvailability(doctorId: string): void {
    this.doctorService.getDoctorAvailability(doctorId).subscribe({
      next: (data) => {
        this.availability = data;
      },
      error: (err) => {
        console.error('Failed to load availability:', err);
      }
    });
  }

  loadDoctorReviews(doctorId: string): void {
    this.doctorService.getDoctorReviews(doctorId).subscribe({
      next: (data) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
      }
    });
  }

  openBookingForm(): void {
    this.showBookingForm = true;
  }

  closeBookingForm(): void {
    this.showBookingForm = false;
    this.selectedDate = '';
    this.selectedTime = '';
    this.availableSlots = [];
  }

  onDateSelected(): void {
    if (!this.availability || !this.selectedDate) return;

    const selected = this.availability.availability.find(day => day.date === this.selectedDate);
    if (selected) {
      this.availableSlots = selected.slots.filter(slot => slot.available);
    } else {
      this.availableSlots = [];
    }
  }

  bookAppointment(): void {
    if (!this.doctor || !this.selectedDate || !this.selectedTime) {
      alert('Please select a date and time');
      return;
    }

    const appointmentData = {
      doctorId: this.doctor.id,
      date: this.selectedDate,
      time: this.selectedTime,
      type: 'in-person'
    };

    this.doctorService.bookAppointment(appointmentData).subscribe({
      next: (response) => {
        alert('Appointment booked successfully!');
        this.closeBookingForm();
        this.router.navigate(['/patient/my-appointments']);
      },
      error: (err) => {
        alert('Failed to book appointment: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  getReviewStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
