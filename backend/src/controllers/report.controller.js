const PDFDocument = require('pdfkit');

/**
 * POST /api/report/generate
 * Generates a downloadable AI Medical Report PDF
 * Body: { symptoms, condition, urgency, specialty, recommendation,
 *         confidence, source, suggestedTests, answers, doctors, mode }
 */
exports.generateReport = (req, res) => {
  try {
    const {
      symptoms       = 'Not specified',
      condition      = 'Not determined',
      urgency        = 'low',
      specialty      = 'General Practice',
      recommendation = '',
      confidence     = 0,
      source         = 'General Medical Knowledge',
      suggestedTests = [],
      answers        = {},
      doctors        = [],
      mode           = 'chat',
      reasons        = [],
    } = req.body;

    const patientName = req.user?.name || 'Patient';
    const now         = new Date();
    const dateStr     = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr     = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Urgency colors mapped to grayscale-safe labels
    const urgencyMap = {
      emergency: { label: '🚨 EMERGENCY',      hex: '#ef4444' },
      high:      { label: '⚠️  URGENT',         hex: '#f59e0b' },
      medium:    { label: '🟡 SEE DOCTOR SOON', hex: '#6366f1' },
      low:       { label: '🟢 NON-URGENT',      hex: '#10b981' },
    };
    const urgencyInfo = urgencyMap[urgency] || urgencyMap.low;

    // ── Build PDF ──────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HealthAI-Report-${now.getTime()}.pdf"`);
    doc.pipe(res);

    // ── Header ─────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
    doc.fillColor('#6366f1').fontSize(22).font('Helvetica-Bold')
       .text('HealthAI', 50, 25);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
       .text('AI-Powered Medical Report', 50, 52);
    doc.fillColor('#475569').fontSize(9)
       .text(`Generated: ${dateStr} at ${timeStr}`, 50, 68);

    // Disclaimer banner
    doc.rect(0, 90, doc.page.width, 28).fill('#7f1d1d');
    doc.fillColor('#fca5a5').fontSize(8.5).font('Helvetica')
       .text('⚠  DISCLAIMER: This report is AI-generated for informational purposes only. It is NOT a medical diagnosis. Always consult a licensed physician.', 50, 100, { width: doc.page.width - 100 });

    doc.moveDown(3);

    // ── Patient Info ───────────────────────────────────────────────────
    doc.fillColor('#1e293b').rect(50, 130, doc.page.width - 100, 50).fill();
    doc.fillColor('#f1f5f9').fontSize(11).font('Helvetica-Bold')
       .text('PATIENT INFORMATION', 65, 140);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
       .text(`Name: ${patientName}   |   Date: ${dateStr}   |   Mode: ${mode === 'flow' ? 'Guided Triage' : 'AI Chat'}`, 65, 158);

    doc.y = 195;

    // ── Section helper ─────────────────────────────────────────────────
    const section = (title, color = '#6366f1') => {
      doc.moveDown(0.5);
      doc.fillColor(color).fontSize(12).font('Helvetica-Bold').text(title);
      doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2)
         .strokeColor(color).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.fillColor('#334155').fontSize(10).font('Helvetica');
    };

    const bullet = (text) => {
      doc.fillColor('#475569').text(`  •  ${text}`, { indent: 10 });
    };

    // ── Urgency Level ──────────────────────────────────────────────────
    section('URGENCY LEVEL', '#6366f1');
    doc.fillColor('#1e293b').rect(50, doc.y, doc.page.width - 100, 32).fill();
    doc.fillColor('#f1f5f9').fontSize(13).font('Helvetica-Bold')
       .text(urgencyInfo.label, 65, doc.y - 28);
    doc.moveDown(1.2);

    // ── Reported Symptoms ──────────────────────────────────────────────
    section('REPORTED SYMPTOMS', '#6366f1');
    if (Object.keys(answers).length > 0) {
      Object.entries(answers).forEach(([key, val]) => {
        bullet(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`);
      });
    } else {
      bullet(symptoms);
    }
    doc.moveDown(0.5);

    // ── AI Analysis ────────────────────────────────────────────────────
    section('AI ANALYSIS', '#6366f1');
    doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
       .text('Possible Condition:');
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold')
       .text(`  ${condition}`);
    doc.moveDown(0.3);
    doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
       .text('Recommended Specialist:');
    doc.fillColor('#475569').fontSize(10).font('Helvetica')
       .text(`  ${specialty}`);
    doc.moveDown(0.3);

    // Confidence bar (text-based)
    if (confidence > 0) {
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
         .text(`AI Confidence: ${confidence}%`);
      const barWidth = Math.round((doc.page.width - 100) * confidence / 100);
      const barY = doc.y + 2;
      doc.rect(50, barY, doc.page.width - 100, 8).fill('#1e293b');
      const barColor = confidence >= 75 ? '#10b981' : confidence >= 50 ? '#f59e0b' : '#ef4444';
      doc.rect(50, barY, barWidth, 8).fill(barColor);
      doc.y = barY + 14;
      doc.moveDown(0.3);
    }

    doc.fillColor('#334155').fontSize(9).font('Helvetica')
       .text(`Source: ${source}`);
    doc.moveDown(0.5);

    // ── Explainability (Why this result) ──────────────────────────────
    if (reasons && reasons.length > 0) {
      section('WHY THIS RESULT (AI REASONING)', '#8b5cf6');
      reasons.forEach(r => bullet(r));
      doc.moveDown(0.5);
    }

    // ── Recommendation ─────────────────────────────────────────────────
    if (recommendation) {
      section('RECOMMENDATION', '#6366f1');
      doc.fillColor('#475569').fontSize(10).font('Helvetica')
         .text(recommendation, { width: doc.page.width - 100 });
      doc.moveDown(0.5);
    }

    // ── Suggested Tests ────────────────────────────────────────────────
    const testMap = {
      cardiology:      ['ECG', 'Echocardiogram', 'Stress Test', 'Blood lipid panel', 'Troponin levels'],
      neurology:       ['MRI Brain', 'CT Scan', 'EEG', 'Nerve Conduction Study'],
      dermatology:     ['Skin biopsy', 'Patch test', 'Dermoscopy'],
      orthopedics:     ['X-Ray', 'MRI', 'CT Scan', 'Bone density scan'],
      pulmonology:     ['Chest X-Ray', 'Spirometry', 'CT Chest', 'Pulse Oximetry'],
      psychiatry:      ['PHQ-9', 'GAD-7', 'Psychological evaluation'],
      gastroenterology:['Endoscopy', 'Abdominal ultrasound', 'Stool test'],
      endocrinology:   ['HbA1c', 'Thyroid panel (TSH, T3, T4)', 'Fasting glucose'],
      general:         ['Complete Blood Count (CBC)', 'Metabolic panel', 'Urinalysis'],
    };
    const specialtyKey = req.body.specialtyKey || 'general';
    const tests = suggestedTests.length > 0 ? suggestedTests : (testMap[specialtyKey] || testMap.general);

    section('SUGGESTED DIAGNOSTIC TESTS', '#6366f1');
    tests.forEach(t => bullet(t));
    doc.moveDown(0.5);

    // ── Recommended Doctors ────────────────────────────────────────────
    if (doctors && doctors.length > 0) {
      section('RECOMMENDED SPECIALISTS', '#6366f1');
      doctors.slice(0, 3).forEach(d => {
        doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
           .text(`  ${d.name || 'Doctor'}`);
        doc.fillColor('#64748b').fontSize(9).font('Helvetica')
           .text(`  ${d.specialty || specialty}  |  Rating: ${d.rating || 'N/A'}  |  Fee: EGP ${d.consultationFee || 'N/A'}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.3);
    }

    // ── Lifestyle Tips ─────────────────────────────────────────────────
    section('GENERAL HEALTH TIPS', '#10b981');
    const tips = [
      'Stay hydrated — drink 8 glasses of water daily',
      'Get 7–9 hours of sleep per night',
      'Exercise at least 30 minutes, 5 days a week',
      'Avoid self-medication without professional guidance',
      'Follow up with a licensed physician for proper diagnosis',
    ];
    tips.forEach(t => bullet(t));

    // ── Footer ─────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
       .strokeColor('#1e293b').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#475569').fontSize(8).font('Helvetica')
       .text('This report was generated by HealthAI — an AI-powered health platform. It is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.', 50, doc.y, { width: doc.page.width - 100, align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor('#334155').fontSize(8)
       .text(`HealthAI © ${now.getFullYear()}  |  healthai.com  |  Report ID: ${now.getTime()}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate report' });
  }
};

/**
 * GET /api/report/health-summary
 * Simple health summary report (for testing)
 */
exports.healthSummary = async (req, res) => {
  try {
    const patientName = req.user?.name || 'Patient';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HealthAI-Summary-${now.getTime()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#0f172a');
    doc.fillColor('#6366f1').fontSize(22).font('Helvetica-Bold')
       .text('HealthAI', 50, 25);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
       .text('Health Summary Report', 50, 52);

    doc.moveDown(3);

    // Patient Info
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
       .text('Patient Information', 50, 120);
    doc.fillColor('#475569').fontSize(11).font('Helvetica')
       .text(`Name: ${patientName}`, 50, 145)
       .text(`Date: ${dateStr}`, 50, 165);

    doc.moveDown(2);

    // Summary
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
       .text('Health Summary', 50, 220);
    doc.fillColor('#475569').fontSize(10).font('Helvetica')
       .text('This is a sample health summary report generated by HealthAI.', 50, 245)
       .text('For detailed medical reports, please use the full report generation feature.', 50, 265);

    doc.moveDown(2);

    // Footer
    doc.fillColor('#64748b').fontSize(8).font('Helvetica')
       .text(`HealthAI © ${now.getFullYear()}  |  healthai.com`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate report' });
  }
};

// ========== NEW AI-ENHANCED CONSULTATION REPORT ==========

const { generateConsultationReport } = require('../services/reportBuilder.service');
const { analyzeTrend } = require('../services/trendAnalysis.service');

/**
 * POST /api/report/consultation
 * Generates an AI-enhanced consultation report with patient history and trends
 * Body: { patientId, doctorId, symptoms, diagnoses, medications, followUp, sections, includeTrends }
 */
exports.generateConsultationReport = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      symptoms,
      diagnoses,
      keyFindings,
      medications,
      followUp,
      sections = ['all'],
      includeTrends = true,
      aiInsights = []
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Authorization check
    if (req.user.role !== 'doctor' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Unauthorized to generate report' });
    }

    // Build consultation data
    const consultationData = {
      patientId,
      doctorId: doctorId || req.user.id,
      date: new Date(),
      symptoms,
      diagnoses,
      keyFindings,
      medications,
      followUp,
      aiInsights,
      startDate: req.body.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: req.body.endDate || new Date()
    };

    // Add trend analysis if requested
    if (includeTrends) {
      const metricTypes = ['blood_sugar', 'blood_pressure', 'weight'];
      const trends = [];
      
      for (const type of metricTypes) {
        try {
          const trend = await analyzeTrend(patientId, type, 6);
          if (trend.dataPoints >= 2) {
            trends.push(trend);
          }
        } catch (error) {
          console.error(`Error analyzing trend for ${type}:`, error);
        }
      }
      
      consultationData.trends = trends;
    }

    // Generate PDF report
    const pdfBuffer = await generateConsultationReport(consultationData, patientId, { sections, includeTrends });

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Consultation-Report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating consultation report:', err);
    res.status(500).json({ message: err.message || 'Failed to generate consultation report' });
  }
};
