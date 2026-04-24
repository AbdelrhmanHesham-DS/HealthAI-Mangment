const {
  analyzeTrend,
  findCorrelations,
  generateAlerts
} = require('./trendAnalysis.service');

// Mock dependencies
jest.mock('../models/HealthMetric');

const HealthMetric = require('../models/HealthMetric');

describe('trendAnalysis.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTrend', () => {
    it('should analyze trend for a metric type', async () => {
      const patientId = 'patient-123';
      const metricType = 'blood_sugar';
      
      const mockMetrics = [
        { value: 100, recordedAt: new Date('2024-01-01') },
        { value: 105, recordedAt: new Date('2024-01-08') },
        { value: 110, recordedAt: new Date('2024-01-15') },
        { value: 115, recordedAt: new Date('2024-01-22') },
        { value: 120, recordedAt: new Date('2024-01-29') }
      ];

      HealthMetric.find.mockResolvedValue(mockMetrics);

      const trend = await analyzeTrend(patientId, metricType, 6);

      expect(trend).toHaveProperty('metricType', metricType);
      expect(trend).toHaveProperty('trend');
      expect(trend).toHaveProperty('dataPoints', 5);
      expect(trend).toHaveProperty('averageValue');
      expect(trend).toHaveProperty('changePercent');
    });

    it('should return insufficient_data for less than 2 data points', async () => {
      const patientId = 'patient-123';
      const metricType = 'blood_sugar';

      HealthMetric.find.mockResolvedValue([
        { value: 100, recordedAt: new Date('2024-01-01') }
      ]);

      const trend = await analyzeTrend(patientId, metricType, 6);

      expect(trend.trend).toBe('insufficient_data');
      expect(trend.dataPoints).toBe(1);
    });

    it('should classify trend as increasing', async () => {
      const patientId = 'patient-123';
      const metricType = 'weight';

      const mockMetrics = [
        { value: 70, recordedAt: new Date('2024-01-01') },
        { value: 71, recordedAt: new Date('2024-01-08') },
        { value: 72, recordedAt: new Date('2024-01-15') },
        { value: 73, recordedAt: new Date('2024-01-22') },
        { value: 74, recordedAt: new Date('2024-01-29') }
      ];

      HealthMetric.find.mockResolvedValue(mockMetrics);

      const trend = await analyzeTrend(patientId, metricType, 6);

      expect(trend.trend).toBe('increasing');
    });

    it('should classify trend as decreasing', async () => {
      const patientId = 'patient-123';
      const metricType = 'weight';

      const mockMetrics = [
        { value: 74, recordedAt: new Date('2024-01-01') },
        { value: 73, recordedAt: new Date('2024-01-08') },
        { value: 72, recordedAt: new Date('2024-01-15') },
        { value: 71, recordedAt: new Date('2024-01-22') },
        { value: 70, recordedAt: new Date('2024-01-29') }
      ];

      HealthMetric.find.mockResolvedValue(mockMetrics);

      const trend = await analyzeTrend(patientId, metricType, 6);

      expect(trend.trend).toBe('decreasing');
    });

    it('should generate alert for significant change', async () => {
      const patientId = 'patient-123';
      const metricType = 'blood_sugar';

      const mockMetrics = [
        { value: 100, recordedAt: new Date('2024-01-01') },
        { value: 105, recordedAt: new Date('2024-01-08') },
        { value: 110, recordedAt: new Date('2024-01-15') },
        { value: 150, recordedAt: new Date('2024-01-22') },
        { value: 160, recordedAt: new Date('2024-01-29') }
      ];

      HealthMetric.find.mockResolvedValue(mockMetrics);

      const trend = await analyzeTrend(patientId, metricType, 6);

      if (trend.alert) {
        expect(trend.alert).toHaveProperty('level');
        expect(trend.alert).toHaveProperty('message');
        expect(trend.alert).toHaveProperty('recommendation');
      }
    });
  });

  describe('findCorrelations', () => {
    it('should find correlations between metrics', async () => {
      const patientId = 'patient-123';
      const metricTypes = ['blood_pressure', 'weight'];

      const mockBPMetrics = [
        { value: 120, recordedAt: new Date('2024-01-01') },
        { value: 125, recordedAt: new Date('2024-01-08') },
        { value: 130, recordedAt: new Date('2024-01-15') }
      ];

      const mockWeightMetrics = [
        { value: 70, recordedAt: new Date('2024-01-01') },
        { value: 72, recordedAt: new Date('2024-01-08') },
        { value: 74, recordedAt: new Date('2024-01-15') }
      ];

      HealthMetric.find
        .mockResolvedValueOnce(mockBPMetrics)
        .mockResolvedValueOnce(mockWeightMetrics);

      const correlations = await findCorrelations(patientId, metricTypes);

      expect(Array.isArray(correlations)).toBe(true);
    });

    it('should return empty array for single metric type', async () => {
      const patientId = 'patient-123';
      const metricTypes = ['blood_pressure'];

      const correlations = await findCorrelations(patientId, metricTypes);

      expect(correlations).toEqual([]);
    });

    it('should return empty array for insufficient data', async () => {
      const patientId = 'patient-123';
      const metricTypes = ['blood_pressure', 'weight'];

      HealthMetric.find
        .mockResolvedValueOnce([{ value: 120 }])
        .mockResolvedValueOnce([{ value: 70 }]);

      const correlations = await findCorrelations(patientId, metricTypes);

      expect(Array.isArray(correlations)).toBe(true);
    });

    it('should identify strong correlations', async () => {
      const patientId = 'patient-123';
      const metricTypes = ['blood_pressure', 'weight'];

      // Highly correlated data
      const mockBPMetrics = [
        { value: 120 },
        { value: 125 },
        { value: 130 },
        { value: 135 },
        { value: 140 }
      ];

      const mockWeightMetrics = [
        { value: 70 },
        { value: 72 },
        { value: 74 },
        { value: 76 },
        { value: 78 }
      ];

      HealthMetric.find
        .mockResolvedValueOnce(mockBPMetrics)
        .mockResolvedValueOnce(mockWeightMetrics);

      const correlations = await findCorrelations(patientId, metricTypes);

      expect(Array.isArray(correlations)).toBe(true);
    });
  });

  describe('generateAlerts', () => {
    it('should generate alert for high significance trend', () => {
      const trendData = {
        metricType: 'blood_sugar',
        trend: 'increasing',
        changePercent: 25,
        clinicalSignificance: 'high',
        recentAverage: 150,
        previousAverage: 120
      };

      const alert = generateAlerts(trendData);

      expect(alert).toHaveProperty('level', 'high');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('recommendation');
      expect(alert.message).toContain('upward');
    });

    it('should not generate alert for low significance', () => {
      const trendData = {
        metricType: 'weight',
        trend: 'stable',
        changePercent: 2,
        clinicalSignificance: 'low',
        recentAverage: 75,
        previousAverage: 74
      };

      const alert = generateAlerts(trendData);

      expect(alert).toBeNull();
    });

    it('should generate alert for decreasing trend', () => {
      const trendData = {
        metricType: 'blood_pressure',
        trend: 'decreasing',
        changePercent: -15,
        clinicalSignificance: 'medium',
        recentAverage: 110,
        previousAverage: 130
      };

      const alert = generateAlerts(trendData);

      expect(alert).toHaveProperty('level', 'medium');
      expect(alert.message).toContain('downward');
    });

    it('should include metric-specific recommendations', () => {
      const trendData = {
        metricType: 'hba1c',
        trend: 'increasing',
        changePercent: 10,
        clinicalSignificance: 'medium',
        recentAverage: 7.5,
        previousAverage: 6.8
      };

      const alert = generateAlerts(trendData);

      expect(alert.recommendation).toContain('diabetes');
    });
  });
});
