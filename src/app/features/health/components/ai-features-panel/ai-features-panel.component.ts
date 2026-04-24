import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIFeaturesService } from '../../../../services/ai-features.service';
import { MarkdownToHtmlPipe } from '../../../../shared/pipes/markdown-to-html.pipe';

@Component({
  selector: 'app-ai-features-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownToHtmlPipe],
  templateUrl: './ai-features-panel.component.html',
  styleUrl: './ai-features-panel.component.css'
})
export class AIFeaturesPanelComponent implements OnInit {
  Object = Object; // Expose Object to template
  activeTab = signal<string>('symptoms');
  isLoading = signal(false);
  result = signal<any>(null);
  
  // Symptom Analysis
  symptoms = signal<string[]>([]);
  symptomInput = signal('');
  age = signal<number | null>(null);
  gender = signal('');
  
  // Blood Test
  testResults = signal<any>({});
  testName = signal('');
  testValue = signal('');
  
  // First Aid
  emergencyDesc = signal('');
  
  // Doctor Assistant
  doctorTask = signal('');
  
  // Prescription
  medications = signal<any[]>([]);
  medName = signal('');
  medDosage = signal('');
  
  // Health Monitoring
  healthMetrics = signal<any>({});
  metricName = signal('');
  metricValue = signal('');
  
  // Appointment
  appointmentRequest = signal('');

  constructor(private aiService: AIFeaturesService) {}

  ngOnInit() {
    this.loadAvailableFeatures();
  }

  loadAvailableFeatures() {
    this.aiService.getAvailableFeatures().subscribe({
      next: (data) => console.log('Available AI Features:', data),
      error: (err) => console.error('Error loading features:', err)
    });
  }

  // ========== SYMPTOM ANALYSIS ==========
  addSymptom() {
    if (this.symptomInput().trim()) {
      this.symptoms.update(s => [...s, this.symptomInput().trim()]);
      this.symptomInput.set('');
    }
  }

  removeSymptom(index: number) {
    this.symptoms.update(s => s.filter((_, i) => i !== index));
  }

  analyzeSymptoms() {
    if (this.symptoms().length === 0) {
      alert('Please add at least one symptom');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.analyzeSymptoms(
      this.symptoms(),
      this.age() || undefined,
      this.gender() || undefined
    ).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== BLOOD TEST ANALYSIS ==========
  addTestResult() {
    if (this.testName().trim() && this.testValue().trim()) {
      this.testResults.update(t => ({
        ...t,
        [this.testName().trim()]: this.testValue().trim()
      }));
      this.testName.set('');
      this.testValue.set('');
    }
  }

  removeTestResult(key: string) {
    this.testResults.update(t => {
      const updated = { ...t };
      delete updated[key];
      return updated;
    });
  }

  analyzeBloodTest() {
    if (Object.keys(this.testResults()).length === 0) {
      alert('Please add at least one test result');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.analyzeBloodTest(this.testResults()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== FIRST AID ==========
  getFirstAidGuidance() {
    if (!this.emergencyDesc().trim()) {
      alert('Please describe the emergency');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.getFirstAidGuidance(this.emergencyDesc()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== DOCTOR ASSISTANT ==========
  getDoctorAssistance() {
    if (!this.doctorTask().trim()) {
      alert('Please describe the task');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.getDoctorAssistance(this.doctorTask()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== PRESCRIPTION ANALYSIS ==========
  addMedication() {
    if (this.medName().trim() && this.medDosage().trim()) {
      this.medications.update(m => [...m, {
        name: this.medName().trim(),
        dosage: this.medDosage().trim()
      }]);
      this.medName.set('');
      this.medDosage.set('');
    }
  }

  removeMedication(index: number) {
    this.medications.update(m => m.filter((_, i) => i !== index));
  }

  analyzePrescription() {
    if (this.medications().length === 0) {
      alert('Please add at least one medication');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.analyzePrescription(this.medications()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== HEALTH MONITORING ==========
  addHealthMetric() {
    if (this.metricName().trim() && this.metricValue().trim()) {
      this.healthMetrics.update(h => ({
        ...h,
        [this.metricName().trim()]: this.metricValue().trim()
      }));
      this.metricName.set('');
      this.metricValue.set('');
    }
  }

  removeHealthMetric(key: string) {
    this.healthMetrics.update(h => {
      const updated = { ...h };
      delete updated[key];
      return updated;
    });
  }

  analyzeHealthMetrics() {
    if (Object.keys(this.healthMetrics()).length === 0) {
      alert('Please add at least one health metric');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.analyzeHealthMetrics(this.healthMetrics()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ========== APPOINTMENT ASSISTANT ==========
  getAppointmentAssistance() {
    if (!this.appointmentRequest().trim()) {
      alert('Please describe your appointment request');
      return;
    }
    
    this.isLoading.set(true);
    this.aiService.getAppointmentAssistance(this.appointmentRequest()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    this.result.set(null);
  }
}
