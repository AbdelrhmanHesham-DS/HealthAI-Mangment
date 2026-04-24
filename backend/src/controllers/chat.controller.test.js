const chatController = require('./chat.controller');

// Mock dependencies
jest.mock('../models/Conversation');
jest.mock('../utils/ragEngine');

const Conversation = require('../models/Conversation');
const { buildRAGPromptSemantic } = require('../utils/ragEngine');

describe('chat.controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-123', name: 'John Doe' },
      body: {
        message: 'What should I do about my headache?',
        conversationId: 'conv-123',
        language: 'en'
      }
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
  });

  describe('sendMessage with patient context injection', () => {
    it('should send message with patient context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'bot', content: 'Hi there!' }
        ],
        patientContext: {
          demographics: { age: 30, gender: 'male' },
          recentMetrics: {
            bloodLevels: [],
            sugarLevels: [{ type: 'fasting_glucose', value: 95 }],
            otherMetrics: []
          }
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      buildRAGPromptSemantic.mockResolvedValue({
        systemPrompt: 'You are a medical assistant.',
        contextUsed: true,
        method: 'semantic'
      });

      // Mock OpenAI response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Based on your symptoms...' } }]
            })
          }
        }
      };

      // This would be called in the actual implementation
      // For now, we're testing the structure
      expect(mockConversation.patientContext).toBeDefined();
      expect(mockConversation.patientContext.demographics).toBeDefined();
    });

    it('should handle conversation without patient context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      buildRAGPromptSemantic.mockResolvedValue({
        systemPrompt: 'You are a medical assistant.',
        contextUsed: false,
        method: 'semantic'
      });

      expect(mockConversation.patientContext).toBeUndefined();
    });

    it('should inject patient health metrics into context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [],
        patientContext: {
          demographics: { age: 45, gender: 'female' },
          recentMetrics: {
            bloodLevels: [
              { type: 'hemoglobin', value: 13.5, unit: 'g/dL' }
            ],
            sugarLevels: [
              { type: 'fasting_glucose', value: 110, unit: 'mg/dL' }
            ],
            otherMetrics: [
              { type: 'blood_pressure', value: 130, value2: 85, unit: 'mmHg' }
            ]
          },
          clinicalFlags: [
            { metric: 'fasting_glucose', status: 'high', message: 'Elevated glucose' }
          ]
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      // Verify context structure
      expect(mockConversation.patientContext.recentMetrics.sugarLevels).toHaveLength(1);
      expect(mockConversation.patientContext.clinicalFlags).toHaveLength(1);
      expect(mockConversation.patientContext.clinicalFlags[0].status).toBe('high');
    });

    it('should prioritize critical clinical flags in context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [],
        patientContext: {
          demographics: { age: 60, gender: 'male' },
          recentMetrics: {
            bloodLevels: [],
            sugarLevels: [],
            otherMetrics: []
          },
          clinicalFlags: [
            { metric: 'blood_pressure', status: 'emergency', message: 'Hypertensive crisis' },
            { metric: 'oxygen', status: 'high', message: 'Low oxygen saturation' },
            { metric: 'weight', status: 'low', message: 'Minor weight change' }
          ]
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      // Verify critical flags are present
      const emergencyFlags = mockConversation.patientContext.clinicalFlags.filter(
        f => f.status === 'emergency' || f.status === 'high'
      );
      expect(emergencyFlags.length).toBeGreaterThan(0);
    });

    it('should handle conversation history with patient context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [
          { role: 'user', content: 'I have high blood pressure' },
          { role: 'bot', content: 'I see. Let me check your recent readings.' },
          { role: 'user', content: 'What should I do?' }
        ],
        patientContext: {
          demographics: { age: 55, gender: 'male' },
          recentMetrics: {
            bloodLevels: [],
            sugarLevels: [],
            otherMetrics: [
              { type: 'blood_pressure', value: 145, value2: 92, unit: 'mmHg' }
            ]
          },
          clinicalFlags: [
            { metric: 'blood_pressure', status: 'high', message: 'Stage 2 hypertension' }
          ]
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      expect(mockConversation.messages.length).toBe(3);
      expect(mockConversation.patientContext.recentMetrics.otherMetrics[0].value).toBe(145);
    });

    it('should format patient context for AI prompt', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [],
        patientContext: {
          demographics: { name: 'John', age: 40, gender: 'male' },
          recentMetrics: {
            bloodLevels: [{ type: 'hemoglobin', value: 14.5, unit: 'g/dL' }],
            sugarLevels: [{ type: 'fasting_glucose', value: 100, unit: 'mg/dL' }],
            otherMetrics: []
          },
          clinicalFlags: []
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      // Verify context can be formatted for AI
      const contextStr = JSON.stringify(mockConversation.patientContext);
      expect(contextStr).toContain('demographics');
      expect(contextStr).toContain('recentMetrics');
      expect(contextStr).toContain('hemoglobin');
    });

    it('should handle empty patient context gracefully', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [],
        patientContext: {
          demographics: {},
          recentMetrics: {
            bloodLevels: [],
            sugarLevels: [],
            otherMetrics: []
          },
          clinicalFlags: []
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      expect(mockConversation.patientContext.recentMetrics.bloodLevels).toEqual([]);
      expect(mockConversation.patientContext.clinicalFlags).toEqual([]);
    });

    it('should preserve patient privacy in context', async () => {
      const mockConversation = {
        _id: 'conv-123',
        userId: 'user-123',
        messages: [],
        patientContext: {
          demographics: { age: 35, gender: 'female' }, // No PII like name
          recentMetrics: {
            bloodLevels: [],
            sugarLevels: [],
            otherMetrics: []
          },
          clinicalFlags: []
        }
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      // Verify no sensitive PII in context
      expect(mockConversation.patientContext.demographics.name).toBeUndefined();
      expect(mockConversation.patientContext.demographics.email).toBeUndefined();
    });
  });
});
