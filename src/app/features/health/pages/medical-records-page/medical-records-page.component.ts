import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { MedicalRecord } from '../../models/health.models';

@Component({
  selector: 'app-medical-records-page',
  standalone: true,
  imports: [CommonModule, HealthNavbarComponent],
  templateUrl: './medical-records-page.component.html',
  styleUrl: './medical-records-page.component.css'
})
export class MedicalRecordsPageComponent {
  records    = signal<MedicalRecord[]>([]);
  isLoading  = signal(true);
  activeType = signal('all');
  expandedId = signal('');

  types = [
    { key: 'all', label: 'All Records', icon: 'fa-folder-open' },
    { key: 'diagnosis', label: 'Diagnoses', icon: 'fa-stethoscope' },
    { key: 'prescription', label: 'Prescriptions', icon: 'fa-prescription-bottle-medical' },
    { key: 'lab', label: 'Lab Results', icon: 'fa-flask' },
    { key: 'imaging', label: 'Imaging', icon: 'fa-x-ray' },
    { key: 'vaccination', label: 'Vaccines', icon: 'fa-syringe' },
  ];

  typeColors: Record<string, string> = {
    diagnosis: '#6366f1', prescription: '#10b981', lab: '#f59e0b', imaging: '#06b6d4', vaccination: '#ef4444'
  };

  filtered = computed(() => {
    const t = this.activeType();
    return t === 'all' ? this.records() : this.records().filter(r => r.type === t);
  });

  constructor(private dataService: HealthDataService) {
    this.dataService.getMedicalRecords().subscribe({
      next: r => { this.records.set(r); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  toggle(id: string) { this.expandedId.set(this.expandedId() === id ? '' : id); }
  color(type: string) { return this.typeColors[type] || '#6366f1'; }
  icon(type: string) { return this.types.find(t => t.key === type)?.icon || 'fa-file-medical'; }
}
