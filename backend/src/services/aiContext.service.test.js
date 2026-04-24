const {
  buildPatientContext,
  formatMetricsForAI,
  prioritizeContext
} = require('./aiContext.service');

// Mock dependencies
jest.mock('../models/HealthMetric');
jest.mock('../models/User');
jest.mock('../utils/clinicalRanges');

const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const { isOutOfRange } = require('../utils/clinicalRanges');

describe('aiContext.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildPatientContext', () => {
    it('should build patient context with health metrics', async () => {
      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'John Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      };

      const mockMetrics = [
        {
          type: 'hemoglobin',
          value: 14.5,
          unit: 'g/dL',
          recordedAt: new Date()
        },
        {
          type: 'fasting_glucose',
          value: 95,
          unit: 'mg/dL',
          recordedAt: new Date()
        }
      ];

      User.findById.mockResolvedValue(mockPatient);
      HealthMetric.find.mockResolvedValue(mockMetrics);
      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal', message: 'Normal' });

      const context = await buildPatientContext(patientId);

      expect(context).toHaveProperty('patientId');
      expect(context).toHaveProperty('demographics');
      expect(context).toHaveProperty('recentMetrics');
      expect(context).toHaveProperty('clinicalFlags');
      expect(context.demographics.name).toBe('John Doe');
      expect(context.demographics.age).toBeGreaterThan(0);
    });

    it('should throw error if patient not found', async () => {
      const patientId = 'invalid-id';
      User.findById.mockResolvedValue(null);

      await expect(buildPatientContext(patientId)).rejects.toThrow('Patient not found');
    });

    it('should handle missing dateOfBirth', async () => {
      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        gender: 'female'
      };

      User.findById.mockResolvedValue(mockPatient);
      HealthMetric.find.mockResolvedValue([]);

      const context = await buildPatientContext(patientId);

      expect(context.demographics.age).toBeNull();
    });

    it('should prioritize context when exceeding token limits', async () => {
      const patientId = 'patient-123';
      const mockPatient = {
        _id: patientId,
        name: 'John Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      };

      const mockMetrics = Array(20).fill({
        type: 'blood_pressure',
        value: 120,
        value2: 80,
        unit: 'mmHg',
        recordedAt: new Date()
      });

      User.findById.mockResolvedValue(mockPatient);
      HealthMetric.find.mockResolvedValue(mockMetrics);
      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal', message: 'Normal' });

      const context = await buildPatientContext(patientId, { maxTokens: 500 });

      expect(context).toHaveProperty('patientId');
      expect(context).toHaveProperty('demographics');
      expect(context).toHaveProperty('clinicalFlags');
    });
  });

  describe('formatMetricsForAI', () => {
    it('should format metrics as readable text', () => {
      const metrics = [
        {
          type: 'blood_pressure',
          value: 120,
          value2: 80,
          unit: 'mmHg',
          date: new Date('2024-01-15')
        },
        {
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          date: new Date('2024-01-15')
        }
      ];

      const formatted = formatMetricsForAI(metrics);

      expect(formatted).toContain('blood pressure');
      expect(formatted).toContain('120/80');
      expect(formatted).toContain('heart rate');
      expect(formatted).toContain('72');
    });

    it('should handle empty metrics array', () => {
      const formatted = formatMetricsForAI([]);

      expect(formatted).toBe('No metrics available');
    });

    it('should handle null metrics', () => {
      const formatted = formatMetricsForAI(null);

      expect(formatted).toBe('No metrics available');
    });

    it('should format metrics with recordedAt field', () => {
      const metrics = [
        {
          type: 'weight',
          value: 75,
          unit: 'kg',
          recordedAt: new Date('2024-01-15')
        }
      ];

      const formatted = formatMetricsForAI(metrics);

      expect(formatted).toContain('weight');
      expect(formatted).toContain('75');
    });
  });

  describe('prioritizeContext', () => {
    it('should return full context if within token limit', () => {
      const contextData = {
        patientId: 'patient-123',
        demographics: { name: 'John', age: 30 },
        clinicalFlags: [],
        recentMetrics: {
          bloodLevels: [{ type: 'hemoglobin', value: 14.5 }],
          sugarLevels: [{ type: 'fasting_glucose', value: 95 }],
          otherMetrics: []
        }
      };

      const prioritized = prioritizeContext(contextData, 5000);

      expect(prioritized).toEqual(contextData);
    });

    it('should prioritize demographics and clinical flags', () => {
      const contextData = {
        patientId: 'patient-123',
        demographics: { name: 'John', age: 30 },
        clinicalFlags: [{ metric: 'blood_pressure', status: 'high' }],
        recentMetrics: {
          bloodLevels: Array(10).fill({ type: 'hemoglobin', value: 14.5 }),
          sugarLevels: Array(10).fill({ type: 'fasting_glucose', value: 95 }),
          otherMetrics: Array(10).fill({ type: 'weight', value: 75 })
        }
      };

      const prioritized = prioritizeContext(contextData, 100);

      expect(prioritized).toHaveProperty('patientId');
      expect(prioritized).toHaveProperty('demographics');
      expect(prioritized).toHaveProperty('clinicalFlags');
      expect(prioritized.recentMetrics.bloodLevels.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty context', () => {
      const contextData = {
        patientId: 'patient-123',
        demographics: {},
        clinicalFlags: [],
        recentMetrics: {
          bloodLevels: [],
          sugarLevels: [],
          otherMetrics: []
        }
      };

      const prioritized = prioritizeContext(contextData, 100);

      expect(prioritized).toHaveProperty('patientId');
    });
  });
});
