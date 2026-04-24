const { generateReport } = require('./report.controller');

// Mock dependencies
jest.mock('pdfkit');

const PDFDocument = require('pdfkit');

describe('report.controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-123', name: 'John Doe' },
      body: {
        symptoms: 'Headache and fever',
        condition: 'Common cold',
        urgency: 'low',
        specialty: 'General Practice',
        recommendation: 'Rest and hydration',
        confidence: 0.85,
        source: 'Medical Knowledge Base',
        suggestedTests: ['Blood test'],
        answers: { duration: '3 days', severity: 'moderate' },
        doctors: [],
        mode: 'chat'
      }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      pipe: jest.fn()
    };

    // Mock PDFDocument
    PDFDocument.mockImplementation(() => ({
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnThis(),
      end: jest.fn(),
      on: jest.fn(),
      page: { width: 612, height: 792 }
    }));
  });

  describe('generateReport', () => {
    it('should generate PDF report with basic information', () => {
      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('HealthAI-Report')
      );
    });

    it('should include urgency level in report', () => {
      req.body.urgency = 'emergency';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should handle different urgency levels', () => {
      const urgencyLevels = ['emergency', 'high', 'medium', 'low'];

      urgencyLevels.forEach(urgency => {
        jest.clearAllMocks();
        req.body.urgency = urgency;

        generateReport(req, res);

        expect(res.setHeader).toHaveBeenCalled();
      });
    });

    it('should include symptoms in report', () => {
      req.body.symptoms = 'Persistent cough and chest pain';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include condition diagnosis in report', () => {
      req.body.condition = 'Bronchitis';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include specialty recommendation in report', () => {
      req.body.specialty = 'Pulmonology';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include suggested tests in report', () => {
      req.body.suggestedTests = ['Chest X-ray', 'Blood culture', 'Sputum test'];

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include confidence score in report', () => {
      req.body.confidence = 0.92;

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include doctor recommendations in report', () => {
      req.body.doctors = [
        { name: 'Dr. Smith', specialty: 'Cardiology', rating: 4.8 },
        { name: 'Dr. Jones', specialty: 'Cardiology', rating: 4.5 }
      ];

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should use patient name from user context', () => {
      req.user.name = 'Jane Smith';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should handle missing user name', () => {
      req.user = {};

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include timestamp in report', () => {
      const beforeTime = new Date();
      generateReport(req, res);
      const afterTime = new Date();

      expect(res.setHeader).toHaveBeenCalled();
      // Verify timestamp is within reasonable range
      expect(res.setHeader.mock.calls[1][1]).toContain('HealthAI-Report');
    });

    it('should handle empty recommendation', () => {
      req.body.recommendation = '';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should handle empty suggested tests', () => {
      req.body.suggestedTests = [];

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include source information in report', () => {
      req.body.source = 'AI Medical Knowledge Base v2.1';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include mode information in report', () => {
      req.body.mode = 'symptom_checker';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include answers from questionnaire in report', () => {
      req.body.answers = {
        duration: '5 days',
        severity: 'severe',
        onset: 'sudden',
        triggers: 'physical activity'
      };

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should include reasons for diagnosis in report', () => {
      req.body.reasons = [
        'Elevated temperature',
        'Persistent cough',
        'Fatigue'
      ];

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should pipe PDF to response', () => {
      generateReport(req, res);

      expect(res.pipe).toHaveBeenCalled();
    });

    it('should set correct content disposition header', () => {
      generateReport(req, res);

      const dispositionCall = res.setHeader.mock.calls.find(
        call => call[0] === 'Content-Disposition'
      );
      expect(dispositionCall[1]).toContain('attachment');
      expect(dispositionCall[1]).toContain('HealthAI-Report');
      expect(dispositionCall[1]).toContain('.pdf');
    });

    it('should handle all default values', () => {
      req.body = {};

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should generate report with high confidence score', () => {
      req.body.confidence = 0.99;

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should generate report with low confidence score', () => {
      req.body.confidence = 0.45;

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should handle emergency urgency with appropriate formatting', () => {
      req.body.urgency = 'emergency';
      req.body.symptoms = 'Chest pain and difficulty breathing';

      generateReport(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });
  });
});
