import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';
import { Doctor } from '../../models/health.models';
import { SlotTimePipe } from '../../pipes/slot-time.pipe';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HealthNavbarComponent, SlotTimePipe],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.css'
})
export class BookingPageComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private dataService = inject(HealthDataService);
  public  auth        = inject(AuthService);

  doctor       = signal<Doctor | null>(null);
  selectedDay  = signal(0);
  selectedSlot = signal('');
  selectedType = signal<'video' | 'in-person' | 'chat'>('video');
  reason       = signal('');
  step         = signal<1 | 2 | 3>(1);
  isSubmitting = signal(false);
  bookingError = signal('');

  consultTypes = [
    { key: 'video',      icon: 'fa-video',            label: 'Video Call' },
    { key: 'in-person',  icon: 'fa-hospital',          label: 'In-Person' },
    { key: 'chat',       icon: 'fa-comment-medical',   label: 'Chat' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) { this.router.navigate(['/health/doctors']); return; }
    this.dataService.getDoctorById(id).subscribe({
      next: doc => this.doctor.set(doc ?? null),
      error: () => this.router.navigate(['/health/doctors']),
    });
  }

  get currentDay() { return this.doctor()?.availability[this.selectedDay()] ?? null; }

  selectSlot(slotId: string) { this.selectedSlot.set(slotId); }

  nextStep() {
    if (this.step() === 1 && this.selectedSlot()) this.step.set(2);
    else if (this.step() === 2) this.step.set(3);
  }

  confirm() {
    if (!this.doctor()) return;
    this.isSubmitting.set(true);
    this.bookingError.set('');
    const day  = this.currentDay!;
    const slot = day.slots.find(s => s.id === this.selectedSlot());

    this.dataService.addAppointment({
      doctorId: this.doctor()!.id,
      slotId:   this.selectedSlot(),
      date:     day.date,
      time:     slot?.time ?? '',
      type:     this.selectedType(),
      reason:   this.reason() || 'General consultation',
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/health/appointments']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.bookingError.set(err.error?.message || 'Booking failed. Please try again.');
      },
    });
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.floor(r) ? 1 : 0); }
}
