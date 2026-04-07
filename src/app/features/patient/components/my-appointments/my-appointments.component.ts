import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthDataService } from '../../../health/services/health-data.service';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.css'
})
export class MyAppointmentsComponent implements OnInit {
  isLoading = signal(true);

  constructor(public dataService: HealthDataService) {}

  upcoming = computed(() =>
    this.dataService.appointments().filter(a => a.status === 'upcoming')
  );
  past = computed(() =>
    this.dataService.appointments().filter(a => a.status === 'completed' || a.status === 'cancelled')
  );

  ngOnInit() {
    this.dataService.getAppointments().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  cancel(id: string) {
    this.dataService.cancelAppointment(id).subscribe();
  }
}
