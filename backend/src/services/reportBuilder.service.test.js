const {
  generateConsultationReport,
  generateAISummary,
  formatMetricsForReport
} = require('./reportBuilder.service');

// Mock dependencies
jest.mock('../models/HealthMetric');
jest.mock('../models/User');
jest.mock('../utils/clinicalRanges');
jest.mock('openai');

const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const { isOutOfRange } = require('../utils/clinicalRanges');
const { OpenAI } = require('openai');

describe('reportBuilder.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  describe('generateConsultationReport', () => {
    it('should generate consultation report PDF', async () => {
      const consultationData = {
        symptoms: 'Headache and fever',
        diagnoses: 'Common cold',
        date: new Date(),
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'John Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        phone: '555-1234'
      };

      const mockDoctor = {
        _id: 'doctor-123',
        name: 'Dr. Smith',
        specialization: 'General Practice'
      };

      const mockMetrics = [
        {
          type: 'temperature',
          value: 38.5,
          unit: '°C',
          recordedAt: new Date()
        }
      ];

      User.findById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      HealthMetric.find.mockResolvedValue(mockMetrics);
      isOutOfRange.mockReturnValue({ inRange: false, severity: 'high', message: 'Elevated' });

      // Mock OpenAI response
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Patient has common cold symptoms' } }]
          })
        }
      };

      const report = await generateConsultationReport(consultationData, patientId);

      expect(report).toBeInstanceOf(Buffer);
      expect(report.length).toBeGreaterThan(0);
    });

    it('should handle missing doctor data', async () => {
      const consultationData = {
        symptoms: 'Headache',
        diagnoses: 'Migraine',
        date: new Date()
      };

      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        gender: 'female'
      };

      User.findById.mockResolvedValueOnce(mockPatient).mockResolvedValueOnce(null);
      HealthMetric.find.mockResolvedValue([]);

      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Summary' } }]
          })
        }
      };

      const report = await generateConsultationReport(consultationData, patientId);

      expect(report).toBeInstanceOf(Buffer);
    });

    it('should throw error if patient not found', async () => {
      const consultationData = { symptoms: 'Test' };
      const patientId = 'invalid-id';

      User.findById.mockResolvedValueOnce(null);

      await expect(generateConsultationReport(consultationData, patientId))
        .rejects.toThrow('Patient not found');
    });

    it('should include specified sections in report', async () => {
      const consultationData = {
        symptoms: 'Fever',
        diagnoses: 'Infection',
        date: new Date()
      };

      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'John Doe',
        email: 'john@example.com',
        gender: 'male'
      };

      User.findById.mockResolvedValueOnce(mockPatient).mockResolvedValueOnce(null);
      HealthMetric.find.mockResolvedValue([]);

      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Summary' } }]
          })
        }
      };

      const report = await generateConsultationReport(consultationData, patientId, {
        sections: ['demographics', 'symptoms']
      });

      expect(report).toBeInstanceOf(Buffer);
    });
  });

  describe('generateAISummary', () => {
    it('should generate patient-friendly summary', async () => {
      const consultationData = {
        symptoms: 'Headache and fever',
        diagnoses: 'Common cold',
        keyFindings: 'Viral infection'
      };

      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'You have a common cold. Rest and hydrate.' } }]
          })
        }
      };

      const summary = await generateAISummary(consultationData, 'patient');

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should generate provider-focused summary', async () => {
      const consultationData = {
        symptoms: 'Persistent cough',
        diagnoses: 'Bronchitis',
        treatmentPlan: 'Antibiotics and rest'
      };

      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Patient presents with acute bronchitis...' } }]
          })
        }
      };

      const summary = await generateAISummary(consultationData, 'provider');

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const consultationData = { symptoms: 'Test' };

      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      const summary = await generateAISummary(consultationData, 'patient');

      expect(summary).toBe('Summary unavailable at this time.');
    });
  });

  describe('formatMetricsForReport', () => {
    it('should format metrics for report table', () => {
      const metrics = [
        {
          type: 'blood_pressure',
          value: 120,
          value2: 80,
          unit: 'mmHg',
          recordedAt: new Date('2024-01-15')
        },
        {
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          recordedAt: new Date('2024-01-15')
        }
      ];

      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal' });

      const formatted = formatMetricsForReport(metrics);

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(2);
      expect(formatted[0]).toContain('BLOOD PRESSURE');
      expect(formatted[0]).toContain('120/80');
      expect(formatted[1]).toContain('HEART RATE');
      expect(formatted[1]).toContain('72');
    });

    it('should mark out-of-range metrics', () => {
      const metrics = [
        {
          type: 'blood_sugar',
          value: 250,
          unit: 'mg/dL',
          recordedAt: new Date('2024-01-15')
        }
      ];

      isOutOfRange.mockReturnValue({ inRange: false, severity: 'high' });

      const formatted = formatMetricsForReport(metrics);

      expect(formatted[0]).toContain('HIGH');
    });

    it('should handle metrics with only single value', () => {
      const metrics = [
        {
          type: 'weight',
          value: 75,
          unit: 'kg',
          recordedAt: new Date('2024-01-15')
        }
      ];

      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal' });

      const formatted = formatMetricsForReport(metrics);

      expect(formatted[0]).toContain('75');
      expect(formatted[0]).not.toContain('/');
    });

    it('should format date correctly', () => {
      const metrics = [
        {
          type: 'temperature',
          value: 37.5,
          unit: '°C',
          recordedAt: new Date('2024-01-15')
        }
      ];

      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal' });

      const formatted = formatMetricsForReport(metrics);

      expect(formatted[0][0]).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });
});
