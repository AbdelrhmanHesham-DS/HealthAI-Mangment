import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HealthDataService } from '../../../health/services/health-data.service';
import { Appointment } from '../../../health/models/health.models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css'
})
export class AppointmentComponent implements OnInit {
  appointment = signal<Appointment | null>(null);
  isLoading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: HealthDataService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) { this.router.navigate(['/health/appointments']); return; }

    // Load from cached signal first, then fetch if needed
    const cached = this.dataService.appointments().find(a => a.id === id);
    if (cached) {
      this.appointment.set(cached);
      this.isLoading.set(false);
    } else {
      // Fetch all appointments and find the one
      this.dataService.getAppointments().subscribe({
        next: () => {
          const found = this.dataService.appointments().find(a => a.id === id) || null;
          this.appointment.set(found);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  cancel() {
    const apt = this.appointment();
    if (!apt) return;
    this.dataService.cancelAppointment(apt.id).subscribe({
      next: () => this.router.navigate(['/health/appointments']),
    });
  }
}
