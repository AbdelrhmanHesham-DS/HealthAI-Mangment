const PDFDocument = require('pdfkit');
const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const { isOutOfRange } = require('../utils/clinicalRanges');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates complete consultation report
 * @param {Object} consultationData - Consultation details
 * @param {string} patientId - Patient's MongoDB ObjectId
 * @param {Object} options - Report options (sections, format)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateConsultationReport(consultationData, patientId, options = {}) {
  try {
    const {
      sections = ['all'],
      includeTrends = true
    } = options;

    // Load patient data
    const patient = await User.findById(patientId).select('name email dateOfBirth gender phone');
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Load doctor data
    const doctor = consultationData.doctorId 
      ? await User.findById(consultationData.doctorId).select('name specialization')
      : null;

    // Load relevant health metrics
    const metrics = await HealthMetric.find({
      patientId,
      recordedAt: {
        $gte: consultationData.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        $lte: consultationData.endDate || new Date()
      }
    }).sort({ recordedAt: -1 }).lean();

    // Generate AI summaries
    const patientSummary = await generateAISummary(consultationData, 'patient');
    const providerSummary = await generateAISummary(consultationData, 'provider');

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });

    // Build report sections
    if (shouldIncludeSection('demographics', sections)) {
      addDemographicsSection(doc, patient, doctor, consultationData);
    }

    if (shouldIncludeSection('symptoms', sections) && consultationData.symptoms) {
      addSymptomsSection(doc, consultationData.symptoms);
    }

    if (shouldIncludeSection('diagnoses', sections) && consultationData.diagnoses) {
      addDiagnosesSection(doc, consultationData.diagnoses);
    }

    if (shouldIncludeSection('metrics', sections) && metrics.length > 0) {
      addMetricsSection(doc, metrics, patient.gender);
    }

    if (shouldIncludeSection('ai_insights', sections)) {
      addAIInsightsSection(doc, patientSummary, providerSummary, consultationData.aiInsights);
    }

    if (shouldIncludeSection('medications', sections) && consultationData.medications) {
      addMedicationsSection(doc, consultationData.medications);
    }

    if (shouldIncludeSection('followup', sections) && consultationData.followUp) {
      addFollowUpSection(doc, consultationData.followUp);
    }

    if (shouldIncludeSection('trends', sections) && includeTrends && consultationData.trends) {
      addTrendsSection(doc, consultationData.trends);
    }

    // Finalize PDF
    doc.end();

    return await pdfPromise;
  } catch (error) {
    console.error('Error generating consultation report:', error);
    throw error;
  }
}

/**
 * Requests AI-generated summaries
 * @param {Object} consultationData - Consultation details
 * @param {string} audienceType - "patient" or "provider"
 * @returns {Promise<string>} AI-generated summary
 */
async function generateAISummary(consultationData, audienceType) {
  try {
    const prompt = audienceType === 'patient'
      ? `Summarize the following medical consultation in simple, patient-friendly language:\n\nSymptoms: ${consultationData.symptoms || 'None reported'}\nDiagnoses: ${consultationData.diagnoses || 'None'}\nKey Findings: ${consultationData.keyFindings || 'None'}\n\nProvide a brief, reassuring summary that a patient can understand.`
      : `Provide a technical medical summary of this consultation for healthcare providers:\n\nSymptoms: ${consultationData.symptoms || 'None reported'}\nDiagnoses: ${consultationData.diagnoses || 'None'}\nKey Findings: ${consultationData.keyFindings || 'None'}\nTreatment Plan: ${consultationData.treatmentPlan || 'None'}\n\nInclude clinical observations and recommendations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a medical documentation assistant. Provide clear, accurate summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return audienceType === 'patient'
      ? 'Summary unavailable at this time.'
      : 'Technical summary unavailable.';
  }
}

/**
 * Formats health metrics for report tables
 * @param {Array} metrics - Health metric documents
 * @returns {Array} Formatted table data
 */
function formatMetricsForReport(metrics) {
  return metrics.map(metric => {
    const date = new Date(metric.recordedAt).toLocaleDateString();
    const value = metric.value2 
      ? `${metric.value}/${metric.value2}`
      : metric.value;
    
    const rangeCheck = isOutOfRange(metric.type, metric.value, 'male', metric.value2);
    const status = rangeCheck.inRange ? 'Normal' : rangeCheck.severity.toUpperCase();

    return [
      date,
      metric.type.replace(/_/g, ' ').toUpperCase(),
      value,
      metric.unit,
      status
    ];
  });
}

// PDF Section Builders

function addDemographicsSection(doc, patient, doctor, consultationData) {
  doc.fontSize(20).text('Consultation Report', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Patient: ${patient.name}`);
  doc.text(`Date of Birth: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}`);
  doc.text(`Gender: ${patient.gender || 'N/A'}`);
  doc.text(`Contact: ${patient.phone || patient.email || 'N/A'}`);
  doc.moveDown();
  
  if (doctor) {
    doc.text(`Doctor: ${doctor.name}`);
    doc.text(`Specialization: ${doctor.specialization || 'General Practice'}`);
  }
  
  doc.text(`Consultation Date: ${consultationData.date ? new Date(consultationData.date).toLocaleDateString() : new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();
}

function addSymptomsSection(doc, symptoms) {
  doc.fontSize(14).text('Symptoms', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(symptoms);
  doc.moveDown();
}

function addDiagnosesSection(doc, diagnoses) {
  doc.fontSize(14).text('Diagnoses', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(diagnoses);
  doc.moveDown();
}

function addMetricsSection(doc, metrics, patientGender) {
  doc.fontSize(14).text('Health Metrics', { underline: true });
  doc.moveDown(0.5);
  
  const tableData = formatMetricsForReport(metrics);
  const headers = ['Date', 'Metric', 'Value', 'Unit', 'Status'];
  
  // Simple table rendering
  doc.fontSize(10);
  const startY = doc.y;
  const colWidths = [80, 120, 80, 60, 80];
  let x = 50;
  
  // Headers
  headers.forEach((header, i) => {
    doc.text(header, x, startY, { width: colWidths[i], continued: false });
    x += colWidths[i];
  });
  
  doc.moveDown();
  
  // Rows
  tableData.forEach(row => {
    x = 50;
    row.forEach((cell, i) => {
      doc.text(cell.toString(), x, doc.y, { width: colWidths[i], continued: i < row.length - 1 });
      x += colWidths[i];
    });
    doc.moveDown(0.5);
  });
  
  doc.moveDown();
}

function addAIInsightsSection(doc, patientSummary, providerSummary, aiInsights) {
  doc.fontSize(14).text('AI-Generated Insights', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(12).text('Patient Summary:', { underline: true });
  doc.fontSize(11).text(patientSummary);
  doc.moveDown();
  
  doc.fontSize(12).text('Clinical Summary:', { underline: true });
  doc.fontSize(11).text(providerSummary);
  doc.moveDown();
  
  if (aiInsights && aiInsights.length > 0) {
    doc.fontSize(12).text('Additional AI Insights:', { underline: true });
    aiInsights.forEach(insight => {
      doc.fontSize(11).text(`• ${insight}`);
    });
    doc.moveDown();
  }
}

function addMedicationsSection(doc, medications) {
  doc.fontSize(14).text('Medications & Treatment Plan', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(medications);
  doc.moveDown();
}

function addFollowUpSection(doc, followUp) {
  doc.fontSize(14).text('Follow-Up Instructions', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(followUp);
  doc.moveDown();
}

function addTrendsSection(doc, trends) {
  doc.fontSize(14).text('Health Trends Analysis', { underline: true });
  doc.moveDown(0.5);
  
  trends.forEach(trend => {
    if (trend.clinicalSignificance !== 'low') {
      doc.fontSize(11).text(`${trend.metricType.replace(/_/g, ' ').toUpperCase()}: ${trend.trend} (${trend.changePercent}% change)`);
      if (trend.alert) {
        doc.fontSize(10).text(`  Alert: ${trend.alert.message}`, { color: 'red' });
        doc.text(`  Recommendation: ${trend.alert.recommendation}`);
      }
      doc.moveDown(0.5);
    }
  });
  
  doc.moveDown();
}

function shouldIncludeSection(sectionName, sections) {
  return sections.includes('all') || sections.includes(sectionName);
}

module.exports = {
  generateConsultationReport,
  generateAISummary,
  formatMetricsForReport
};
