import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HealthDataService } from '../../../health/services/health-data.service';
import { Doctor } from '../../../health/models/health.models';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css'
})
export class BookAppointmentComponent implements OnInit {
  doctors = signal<Doctor[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitted = signal(false);
  errors: Record<string, string> = {};

  selectedDoctorId = '';
  appointmentDate = '';
  selectedTimeSlot = '';
  symptoms = '';
  visitType: 'in-person' | 'video' | 'chat' = 'in-person';

  constructor(private dataService: HealthDataService, private router: Router) {}

  ngOnInit() {
    this.dataService.getDoctors().subscribe({
      next: docs => { this.doctors.set(docs); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.selectedDoctorId) this.errors['doctor'] = 'Please select a doctor';
    if (!this.appointmentDate) this.errors['date'] = 'Please select a date';
    else if (new Date(this.appointmentDate) < new Date(new Date().toDateString()))
      this.errors['date'] = 'Date cannot be in the past';
    if (!this.selectedTimeSlot) this.errors['time'] = 'Please select a time slot';
    if (!this.symptoms.trim()) this.errors['symptoms'] = 'Please describe your symptoms';
    return Object.keys(this.errors).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting.set(true);
    this.dataService.addAppointment({
      doctorId: this.selectedDoctorId,
      date: this.appointmentDate,
      time: this.selectedTimeSlot,
      type: this.visitType,
      reason: this.symptoms,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/health/appointments']);
      },
      error: (err) => {
        this.errors['submit'] = err.error?.message || 'Booking failed. Please try again.';
        this.isSubmitting.set(false);
      },
    });
  }

  get selectedDoctor(): Doctor | undefined {
    return this.doctors().find(d => d.id === this.selectedDoctorId);
  }

  timeSlots = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM'];
}
