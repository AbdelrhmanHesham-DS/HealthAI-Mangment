import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAppointmentService, Doctor, Appointment } from '../../services/admin-appointment.service';

@Component({
  selector: 'app-admin-appointment-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-appointment-booking.component.html',
  styleUrl: './admin-appointment-booking.component.css'
})
export class AdminAppointmentBookingComponent implements OnInit {
  doctors = signal<Doctor[]>([]);
  selectedDoctor = signal<Doctor | null>(null);
  availableSlots = signal<any[]>([]);
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  selectedSlotId = signal<string>('');
  appointmentType = signal<string>('in-person');
  reason = signal<string>('');
  
  loading = signal(false);
  error = signal<string>('');
  successMessage = signal<string>('');
  bookedAppointment = signal<Appointment | null>(null);
  showConfirmation = signal(false);

  isFormValid = computed(() => {
    return this.selectedDoctor() && this.selectedDate() && this.selectedTime();
  });

  constructor(private appointmentService: AdminAppointmentService) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading.set(true);
    this.error.set('');
    this.appointmentService.getDoctorList().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load doctors. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onDoctorSelected(doctor: Doctor) {
    this.selectedDoctor.set(doctor);
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.selectedSlotId.set('');
    this.availableSlots.set([]);
    this.loadDoctorAvailability(doctor.id);
  }

  loadDoctorAvailability(doctorId: string) {
    this.loading.set(true);
    this.error.set('');
    this.appointmentService.getDoctorAvailability(doctorId).subscribe({
      next: (data) => {
        this.availableSlots.set(data.availability || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load doctor availability. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onDateSelected(date: string) {
    this.selectedDate.set(date);
    this.selectedTime.set('');
    this.selectedSlotId.set('');
  }

  onTimeSelected(time: string, slotId?: string) {
    this.selectedTime.set(time);
    if (slotId) {
      this.selectedSlotId.set(slotId);
    }
  }

  bookAppointment() {
    if (!this.isFormValid()) {
      this.error.set('Please select a doctor, date, and time.');
      return;
    }

    const doctor = this.selectedDoctor();
    if (!doctor) return;

    this.loading.set(true);
    this.error.set('');

    const appointmentData = {
      doctorId: doctor.id,
      date: this.selectedDate(),
      time: this.selectedTime(),
      slotId: this.selectedSlotId(),
      type: this.appointmentType(),
      reason: this.reason()
    };

    this.appointmentService.bookAdminAppointment(appointmentData).subscribe({
      next: (appointment) => {
        this.bookedAppointment.set(appointment);
        this.showConfirmation.set(true);
        this.successMessage.set('Appointment booked successfully!');
        this.loading.set(false);
        this.resetForm();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to book appointment. Please try again.');
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.selectedDoctor.set(null);
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.selectedSlotId.set('');
    this.appointmentType.set('in-person');
    this.reason.set('');
    this.availableSlots.set([]);
  }

  closeConfirmation() {
    this.showConfirmation.set(false);
    this.bookedAppointment.set(null);
    this.successMessage.set('');
  }

  addToCalendar() {
    const appointment = this.bookedAppointment();
    if (!appointment) return;

    // Create a simple calendar event (can be enhanced with calendar integration)
    const eventTitle = `Appointment with ${appointment.doctorName}`;
    const eventDate = new Date(`${appointment.date}T${appointment.time}`);
    const eventEnd = new Date(eventDate.getTime() + 60 * 60000); // 1 hour duration

    // Format for Google Calendar or similar
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${this.formatDateForCalendar(eventDate)}/${this.formatDateForCalendar(eventEnd)}&details=${encodeURIComponent(`Doctor: ${appointment.doctorName}\nLocation: ${appointment.address || 'TBD'}`)}&location=${encodeURIComponent(appointment.address || '')}`;

    window.open(calendarUrl, '_blank');
  }

  private formatDateForCalendar(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  getAvailableDates(): string[] {
    const dates = new Set<string>();
    this.availableSlots().forEach(daySlot => {
      if (daySlot.date) {
        dates.add(daySlot.date);
      }
    });
    return Array.from(dates).sort();
  }

  getAvailableTimesForDate(date: string): any[] {
    const daySlot = this.availableSlots().find(d => d.date === date);
    if (!daySlot || !daySlot.slots) return [];
    return daySlot.slots.filter((slot: any) => slot.available);
  }
}
