import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientHistoryService, HealthMetric, PatientHistoryResponse } from '../../services/patient-history.service';

@Component({
  selector: 'app-patient-history-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-history-viewer.component.html',
  styleUrls: ['./patient-history-viewer.component.css']
})
export class PatientHistoryViewerComponent implements OnInit {
  @Input() patientId!: string;

  historyData: PatientHistoryResponse | null = null;
  loading = false;
  error: string | null = null;

  // Filters
  selectedMetricType: string = '';
  startDate: string = '';
  endDate: string = '';

  // Available metric types for filter
  metricTypes = [
    { value: '', label: 'All Metrics' },
    { value: 'hemoglobin', label: 'Hemoglobin' },
    { value: 'white_blood_cells', label: 'White Blood Cells' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'fasting_glucose', label: 'Fasting Glucose' },
    { value: 'hba1c', label: 'HbA1c' },
    { value: 'blood_pressure', label: 'Blood Pressure' },
    { value: 'cholesterol_total', label: 'Total Cholesterol' },
    { value: 'weight', label: 'Weight' }
  ];

  constructor(private patientHistoryService: PatientHistoryService) {}

  ngOnInit(): void {
    if (this.patientId) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    const filters: any = {};
    if (this.selectedMetricType) filters.metricType = this.selectedMetricType;
    if (this.startDate) filters.startDate = this.startDate;
    if (this.endDate) filters.endDate = this.endDate;

    this.patientHistoryService.getPatientHistory(this.patientId, filters)
      .subscribe({
        next: (data) => {
          this.historyData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load patient history';
          this.loading = false;
          console.error('Error loading history:', err);
        }
      });
  }

  applyFilters(): void {
    this.loadHistory();
  }

  clearFilters(): void {
    this.selectedMetricType = '';
    this.startDate = '';
    this.endDate = '';
    this.loadHistory();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatMetricName(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'normal': return 'status-normal';
      case 'low': return 'status-warning';
      case 'medium': return 'status-warning';
      case 'high': return 'status-danger';
      case 'emergency': return 'status-emergency';
      default: return 'status-normal';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'normal': return '✓';
      case 'low': return '⚠';
      case 'medium': return '⚠';
      case 'high': return '⚠';
      case 'emergency': return '🚨';
      default: return '✓';
    }
  }
}
