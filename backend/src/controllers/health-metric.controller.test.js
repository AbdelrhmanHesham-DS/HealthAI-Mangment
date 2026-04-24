const {
  getPatientHistory,
  getPatientTrends,
  getPatientSummary
} = require('./health-metric.controller');

// Mock dependencies
jest.mock('../models/HealthMetric');
jest.mock('../models/User');
jest.mock('../utils/clinicalRanges');
jest.mock('../services/trendAnalysis.service');

const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const { isOutOfRange } = require('../utils/clinicalRanges');
const { analyzeTrend, findCorrelations } = require('../services/trendAnalysis.service');

describe('health-metric.controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-123', role: 'doctor' },
      params: { patientId: 'patient-123' },
      query: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getPatientHistory', () => {
    it('should return patient health history', async () => {
      const mockMetrics = [
        {
          _id: 'metric-1',
          type: 'blood_pressure',
          value: 120,
          value2: 80,
          unit: 'mmHg',
          recordedAt: new Date()
        },
        {
          _id: 'metric-2',
          type: 'fasting_glucose',
          value: 95,
          unit: 'mg/dL',
          recordedAt: new Date()
        }
      ];

      const mockPatient = { _id: 'patient-123', gender: 'male' };

      HealthMetric.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockMetrics)
          })
        })
      });

      User.findById.mockResolvedValue(mockPatient);
      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal', message: 'Normal' });

      await getPatientHistory(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('totalRecords', 2);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('bloodLevels');
      expect(response.data).toHaveProperty('sugarLevels');
      expect(response.data).toHaveProperty('otherMetrics');
    });

    it('should filter by metric type', async () => {
      req.query.metricType = 'blood_pressure';

      const mockMetrics = [
        {
          type: 'blood_pressure',
          value: 120,
          value2: 80,
          unit: 'mmHg',
          recordedAt: new Date()
        }
      ];

      HealthMetric.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockMetrics)
          })
        })
      });

      User.findById.mockResolvedValue({ gender: 'male' });
      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal', message: 'Normal' });

      await getPatientHistory(req, res);

      expect(HealthMetric.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'blood_pressure' })
      );
    });

    it('should filter by date range', async () => {
      req.query.startDate = '2024-01-01';
      req.query.endDate = '2024-01-31';

      HealthMetric.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        })
      });

      User.findById.mockResolvedValue({ gender: 'male' });

      await getPatientHistory(req, res);

      expect(HealthMetric.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recordedAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      );
    });

    it('should deny access for unauthorized users', async () => {
      req.user = { id: 'other-user', role: 'patient' };

      await getPatientHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Unauthorized access to patient data' })
      );
    });

    it('should allow patient to access own history', async () => {
      req.user = { id: 'patient-123', role: 'patient' };

      HealthMetric.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        })
      });

      User.findById.mockResolvedValue({ gender: 'female' });

      await getPatientHistory(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getPatientTrends', () => {
    it('should return trend analysis for metrics', async () => {
      req.query.metricTypes = 'blood_sugar,blood_pressure';
      req.query.months = '6';

      const mockTrends = [
        {
          metricType: 'blood_sugar',
          trend: 'increasing',
          changePercent: 15
        },
        {
          metricType: 'blood_pressure',
          trend: 'stable',
          changePercent: 2
        }
      ];

      analyzeTrend
        .mockResolvedValueOnce(mockTrends[0])
        .mockResolvedValueOnce(mockTrends[1]);

      findCorrelations.mockResolvedValue([]);

      await getPatientTrends(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('trends');
      expect(response).toHaveProperty('correlations');
      expect(response.trends.length).toBe(2);
    });

    it('should use default metric types if not specified', async () => {
      analyzeTrend.mockResolvedValue({ trend: 'stable' });
      findCorrelations.mockResolvedValue([]);

      await getPatientTrends(req, res);

      expect(analyzeTrend).toHaveBeenCalledTimes(3); // Default 3 metrics
    });

    it('should find correlations between metrics', async () => {
      req.query.metricTypes = 'blood_pressure,weight';

      const mockCorrelations = [
        {
          metric1: 'blood_pressure',
          metric2: 'weight',
          coefficient: 0.75,
          strength: 'strong'
        }
      ];

      analyzeTrend.mockResolvedValue({ trend: 'stable' });
      findCorrelations.mockResolvedValue(mockCorrelations);

      await getPatientTrends(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.correlations.length).toBe(1);
    });

    it('should deny access for unauthorized users', async () => {
      req.user = { id: 'other-user', role: 'patient' };

      await getPatientTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getPatientSummary', () => {
    it('should return patient health summary', async () => {
      const mockMetrics = {
        blood_pressure: {
          _id: 'metric-1',
          type: 'blood_pressure',
          value: 120,
          value2: 80,
          unit: 'mmHg',
          recordedAt: new Date()
        },
        heart_rate: {
          _id: 'metric-2',
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          recordedAt: new Date()
        }
      };

      const mockPatient = { gender: 'male', dateOfBirth: new Date('1990-01-01') };

      User.findById.mockResolvedValue(mockPatient);

      HealthMetric.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      }));

      // Mock specific metric returns
      let callCount = 0;
      HealthMetric.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(
            callCount++ === 0 ? mockMetrics.blood_pressure : null
          )
        })
      }));

      isOutOfRange.mockReturnValue({ inRange: true, severity: 'normal', message: 'Normal' });

      await getPatientSummary(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('latestMetrics');
      expect(response).toHaveProperty('riskScore');
      expect(response).toHaveProperty('areasOfConcern');
      expect(response).toHaveProperty('anomalies');
    });

    it('should identify areas of concern', async () => {
      const mockMetric = {
        type: 'blood_pressure',
        value: 180,
        value2: 120,
        recordedAt: new Date()
      };

      User.findById.mockResolvedValue({ gender: 'male' });

      HealthMetric.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockMetric)
        })
      }));

      isOutOfRange.mockReturnValue({
        inRange: false,
        severity: 'emergency',
        message: 'Hypertensive crisis'
      });

      await getPatientSummary(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.areasOfConcern.length).toBeGreaterThan(0);
      expect(response.riskScore).toBeGreaterThan(0);
    });

    it('should detect anomalies in metric changes', async () => {
      const mockCurrent = {
        type: 'weight',
        value: 90,
        recordedAt: new Date()
      };

      const mockPrevious = {
        type: 'weight',
        value: 75,
        recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };

      User.findById.mockResolvedValue({ gender: 'male' });

      let firstCall = true;
      HealthMetric.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(firstCall ? (firstCall = false, mockCurrent) : mockPrevious)
        })
      }));

      isOutOfRange.mockReturnValue({ inRange: false, severity: 'high', message: 'High' });

      await getPatientSummary(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.anomalies.length).toBeGreaterThan(0);
    });

    it('should deny access for unauthorized users', async () => {
      req.user = { id: 'other-user', role: 'patient' };

      await getPatientSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
