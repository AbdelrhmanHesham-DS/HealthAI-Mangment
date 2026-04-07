import { Component, signal, OnInit, inject, PLATFORM_ID, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';

interface MetricConfig {
  type: string;
  label: string;
  icon: string;
  color: string;
  unit: string;
  unit2?: string;
  normal: string;
  placeholder: string;
  placeholder2?: string;
  hasTwo?: boolean;
}

@Component({
  selector: 'app-health-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HealthNavbarComponent],
  templateUrl: './health-tracker.component.html',
  styleUrl: './health-tracker.component.css',
})
export class HealthTrackerComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private dataService = inject(HealthDataService);
  private platformId  = inject(PLATFORM_ID);

  summary   = signal<any>({});
  risks     = signal<any[]>([]);
  predictions = signal<any[]>([]);
  metrics   = signal<any[]>([]);
  isLoading = signal(true);
  isSaving  = signal(false);
  saved     = signal(false);
  activeType = signal('blood_pressure');
  showForm   = signal(false);

  newValue  = signal('');
  newValue2 = signal('');
  newNote   = signal('');

  metricConfigs: MetricConfig[] = [
    { type: 'blood_pressure', label: 'Blood Pressure', icon: 'fa-heart-pulse',  color: '#ef4444', unit: 'mmHg', unit2: 'mmHg', normal: '< 120/80 mmHg', placeholder: 'Systolic (e.g. 120)', placeholder2: 'Diastolic (e.g. 80)', hasTwo: true },
    { type: 'heart_rate',     label: 'Heart Rate',     icon: 'fa-heart',         color: '#f97316', unit: 'bpm',  normal: '60–100 bpm',   placeholder: 'e.g. 72' },
    { type: 'blood_sugar',    label: 'Blood Sugar',    icon: 'fa-droplet',       color: '#8b5cf6', unit: 'mg/dL',normal: '70–99 mg/dL',  placeholder: 'e.g. 90' },
    { type: 'weight',         label: 'Weight',         icon: 'fa-weight-scale',  color: '#06b6d4', unit: 'kg',   normal: 'BMI 18.5–24.9', placeholder: 'e.g. 70' },
    { type: 'temperature',    label: 'Temperature',    icon: 'fa-thermometer',   color: '#10b981', unit: '°C',   normal: '36.1–37.2 °C',  placeholder: 'e.g. 36.6' },
    { type: 'oxygen',         label: 'Oxygen Sat.',    icon: 'fa-lungs',         color: '#6366f1', unit: '%',    normal: '95–100%',       placeholder: 'e.g. 98' },
    { type: 'steps',          label: 'Daily Steps',    icon: 'fa-person-walking',color: '#f59e0b', unit: 'steps',normal: '8,000–10,000',  placeholder: 'e.g. 8500' },
  ];

  get activeConfig(): MetricConfig {
    return this.metricConfigs.find(m => m.type === this.activeType()) || this.metricConfigs[0];
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.renderChart(), 500);
    }
  }

  loadData() {
    this.isLoading.set(true);
    this.dataService.getMetricsSummary().subscribe({
      next: data => {
        this.summary.set(data.summary || {});
        this.risks.set(data.risks || []);
        this.predictions.set(data.predictions || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
    this.loadMetrics();
  }

  loadMetrics() {
    this.dataService.getMetrics(this.activeType()).subscribe(m => {
      this.metrics.set(m);
      if (isPlatformBrowser(this.platformId)) setTimeout(() => this.renderChart(), 200);
    });
  }

  selectType(type: string) {
    this.activeType.set(type);
    this.showForm.set(false);
    this.loadMetrics();
  }

  save() {
    const val = parseFloat(this.newValue());
    if (!val) return;
    this.isSaving.set(true);
    const cfg = this.activeConfig;
    const payload: any = {
      type: cfg.type,
      value: val,
      unit: cfg.unit,
      note: this.newNote(),
    };
    if (cfg.hasTwo && this.newValue2()) payload.value2 = parseFloat(this.newValue2());

    this.dataService.addMetric(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.set(true);
        this.newValue.set('');
        this.newValue2.set('');
        this.newNote.set('');
        this.showForm.set(false);
        setTimeout(() => this.saved.set(false), 3000);
        this.loadData();
      },
      error: () => this.isSaving.set(false),
    });
  }

  deleteMetric(id: string) {
    this.dataService.deleteMetric(id).subscribe(() => {
      this.metrics.update(list => list.filter(m => m.id !== id));
    });
  }

  private async renderChart() {
    if (!this.chartCanvas || !isPlatformBrowser(this.platformId)) return;
    const data = this.metrics().slice(0, 14).reverse();
    if (!data.length) return;
    try {
      const { Chart, registerables } = await import('chart.js/auto');
      Chart.register(...registerables);
      const existing = Chart.getChart(this.chartCanvas.nativeElement);
      if (existing) existing.destroy();
      const cfg = this.activeConfig;
      new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: data.map(m => new Date(m.recordedAt).toLocaleDateString()),
          datasets: [{
            label: cfg.label,
            data: data.map(m => m.value),
            borderColor: cfg.color,
            backgroundColor: cfg.color + '18',
            borderWidth: 2.5, fill: true, tension: 0.4,
            pointBackgroundColor: cfg.color, pointRadius: 4, pointHoverRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
          },
        },
      });
    } catch {}
  }

  getStatusColor(type: string, value: number): string {
    const ranges: Record<string, { ok: [number, number]; warn: [number, number] }> = {
      blood_pressure: { ok: [90, 120], warn: [120, 140] },
      heart_rate:     { ok: [60, 100], warn: [50, 110] },
      blood_sugar:    { ok: [70, 99],  warn: [100, 125] },
      temperature:    { ok: [36.1, 37.2], warn: [37.2, 38] },
      oxygen:         { ok: [95, 100], warn: [90, 95] },
    };
    const r = ranges[type];
    if (!r) return '#10b981';
    if (value >= r.ok[0] && value <= r.ok[1]) return '#10b981';
    if (value >= r.warn[0] && value <= r.warn[1]) return '#f59e0b';
    return '#ef4444';
  }

  formatValue(m: any): string {
    if (m.value2) return `${m.value}/${m.value2}`;
    return String(m.value);
  }
}
