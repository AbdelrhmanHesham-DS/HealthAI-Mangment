# Implementation Plan: AI Healthcare Enhancements

## Overview

This implementation plan breaks down the AI healthcare enhancements into discrete coding tasks. The feature adds comprehensive patient history viewing, AI context enhancement with patient data, and improved consultation report generation. Implementation follows a layered approach: data layer → service layer → API layer → frontend integration → testing.

## Tasks

- [x] 1. Extend data layer with new metric types and validation
  - [x] 1.1 Extend HealthMetric model with new metric types
    - Add new blood level types (hemoglobin, white_blood_cells, platelets, red_blood_cells, hematocrit, mcv, mch, mchc) to the type enum in `backend/src/models/HealthMetric.js`
    - Add new sugar level types (fasting_glucose, postprandial_glucose, hba1c, random_glucose) to the type enum
    - Add new common metric types (cholesterol_total, ldl, hdl, triglycerides, creatinine, bun, alt, ast) to the type enum
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  
  - [x] 1.2 Create clinical ranges utility module
    - Create `backend/src/utils/clinicalRanges.js` with CLINICAL_RANGES constant defining normal ranges for all metric types
    - Implement `isOutOfRange(metricType, value, patientGender)` function that returns {inRange, severity, message}
    - Include gender-specific ranges for metrics like hemoglobin
    - Include multi-level ranges for metrics like blood pressure (normal, elevated, stage1, stage2, crisis)
    - _Requirements: 1.6, 2.4, 7.4_
  
  - [x] 1.4 Add database indexes for efficient querying
    - Add compound index on HealthMetric model for {patient, type, date} to optimize filtered queries
    - Add index on {patient, date} for chronological retrieval
    - _Requirements: 2.6, 2.7_
  
  - [x] 1.5 Create ConsultationContext model
    - Create `backend/src/models/ConsultationContext.js` with schema for storing consultation context snapshots
    - Include fields: consultationId, patientId, doctorId, startTime, endTime, contextSnapshot, aiInteractions
    - _Requirements: 3.1, 3.6_

- [x] 2. Implement AI Context Engine service
  - [x] 2.1 Create AI Context Engine service skeleton
    - Create `backend/src/services/aiContext.service.js` with function stubs
    - Define context structure interface as documented in design
    - _Requirements: 3.1, 3.6_
  
  - [x] 2.2 Implement buildPatientContext function
    - Implement `buildPatientContext(patientId, options)` to load patient demographics
    - Query HealthMetric model for recent blood levels (limit 10, sorted by date desc)
    - Query HealthMetric model for recent sugar levels (limit 10, sorted by date desc)
    - Query MedicalRecord model for history from past 12 months
    - Identify clinical flags using clinicalRanges utility
    - Return structured context object
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.4 Implement formatMetricsForAI function
    - Implement `formatMetricsForAI(metrics)` to convert metric documents to AI-readable text
    - Format each metric as: "[Date] [Type]: [Value] [Unit] (Status: [normal/high/low])"
    - Group metrics by category (blood levels, sugar levels, vitals)
    - _Requirements: 3.6_
  
  - [x] 2.6 Implement prioritizeContext function
    - Implement `prioritizeContext(contextData, maxTokens)` to trim context when exceeding limits
    - Estimate token count using character count / 4 approximation
    - Prioritize: recent metrics > medical history > older metrics
    - Maintain chronological order within each category
    - _Requirements: 3.7_

- [x] 3. Implement Trend Analysis service
  - [x] 3.1 Create Trend Analysis service skeleton
    - Create `backend/src/services/trendAnalysis.service.js` with function stubs
    - Define trend analysis output structure as documented in design
    - _Requirements: 6.1, 6.2_
  
  - [x] 3.2 Implement analyzeTrend function
    - Implement `analyzeTrend(patientId, metricType, months)` to retrieve metric history
    - Calculate linear regression slope and correlation coefficient
    - Classify trend as "increasing", "decreasing", or "stable" based on slope and R²
    - Calculate averages for recent period vs previous period
    - Determine clinical significance based on change percentage and metric type
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [x] 3.4 Implement generateAlerts function
    - Implement `generateAlerts(trendData)` to create alerts for concerning trends
    - Generate alert when change percentage exceeds thresholds (e.g., >15% for blood sugar)
    - Set alert severity based on clinical significance and trend direction
    - Include recommendation text based on metric type and trend
    - _Requirements: 6.3_
  
  - [x] 3.6 Implement findCorrelations function
    - Implement `findCorrelations(patientId, metricTypes)` to identify correlated metrics
    - Calculate correlation coefficients between metric pairs
    - Identify concurrent changes above threshold (e.g., both metrics change >10% in same period)
    - Return correlation findings with strength and clinical relevance
    - _Requirements: 6.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Report Builder service
  - [x] 5.1 Create Report Builder service skeleton
    - Create `backend/src/services/reportBuilder.service.js` with function stubs
    - Import PDFKit and set up PDF generation utilities
    - _Requirements: 5.1_
  
  - [x] 5.2 Implement generateConsultationReport function
    - Implement `generateConsultationReport(consultationData, patientId, options)` main orchestration
    - Collect patient demographics, consultation details, health metrics
    - Request AI summaries for patient and provider audiences
    - Build PDF document with all sections
    - Return PDF buffer
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 5.4 Implement generateAISummary function
    - Implement `generateAISummary(consultationData, audienceType)` to call OpenAI API
    - Create prompts for "patient" audience (plain language) and "provider" audience (technical)
    - Include consultation symptoms, diagnoses, and key findings in prompt
    - Return AI-generated summary text
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [x] 5.5 Implement formatMetricsForReport function
    - Implement `formatMetricsForReport(metrics)` to create table data structure
    - Format each metric as table row: [Date, Metric Type, Value, Unit, Status]
    - Apply status indicators (normal/high/low) using clinicalRanges utility
    - _Requirements: 5.8_
  
  - [x] 5.7 Add PDF section builders
    - Implement helper functions for each report section: demographics, symptoms, diagnoses, metrics table, AI insights, medications, follow-up
    - Use PDFKit API to format text, tables, and spacing
    - Include trend analysis section conditionally when significant trends exist
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.6_

- [x] 6. Extend Health Metrics Controller with new endpoints
  - [x] 6.1 Add getPatientHistory endpoint
    - Add `exports.getPatientHistory` function to `backend/src/controllers/health-metric.controller.js`
    - Implement GET /api/metrics/patient/:patientId/history route
    - Verify doctor authorization (check doctor-patient relationship or active consultation)
    - Parse query parameters: dateRange (start, end), metricType filter
    - Query HealthMetric model with filters
    - Apply clinicalRanges utility to identify out-of-range values
    - Return formatted history with visual indicators
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 6.4 Add getPatientTrends endpoint
    - Add `exports.getPatientTrends` function to health metrics controller
    - Implement GET /api/metrics/patient/:patientId/trends route
    - Verify doctor authorization
    - Parse query parameters: metricTypes array, months (default 6)
    - Call trendAnalysis.analyzeTrend for each metric type
    - Return trend analysis results with alerts
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 6.5 Add getPatientSummary endpoint
    - Add `exports.getPatientSummary` function to health metrics controller
    - Implement GET /api/metrics/patient/:patientId/summary route
    - Verify doctor authorization
    - Retrieve latest reading for each metric type
    - Calculate risk score based on out-of-range metrics and trends
    - Identify areas of concern
    - Detect anomalies (values >2 std dev from population mean or >20% change)
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 7. Enhance Chat Controller with patient context
  - [x] 7.1 Modify sendMessage endpoint to support consultation context
    - Update `exports.sendMessage` in `backend/src/controllers/chat.controller.js`
    - Check for `consultationContext` in request body
    - If present, call aiContext.buildPatientContext with patientId
    - Inject patient context into AI system prompt before OpenAI call
    - Format context as: "Patient Context: [demographics] Recent Metrics: [formatted metrics] Medical History: [history entries]"
    - _Requirements: 3.1, 3.5, 4.2, 4.3_
  
  - [x] 7.2 Add AI safety checks to responses
    - Implement emergency keyword detection (can't breathe, chest pain, unconscious, severe bleeding)
    - If emergency detected, return refusal response directing to emergency services
    - Add medical disclaimer to all medical recommendations
    - Check for incomplete patient data and acknowledge limitations in response
    - Add medication warnings when discussing specific drugs
    - Implement harmful content detection and suppression
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.7_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extend Report Controller with enhanced generation
  - [x] 9.1 Modify generateReport endpoint to use Report Builder service
    - Update report generation endpoint in `backend/src/controllers/report.controller.js` (or create if doesn't exist)
    - Call reportBuilder.generateConsultationReport with consultation data and patient ID
    - Include options for section selection if provided in request
    - Stream PDF buffer to response with appropriate headers
    - Set Content-Type: application/pdf and Content-Disposition: attachment
    - _Requirements: 5.1, 5.9, 5.10_
  
  - [x] 9.2 Add report customization support
    - Parse `sections` array from request body to allow doctors to select report sections
    - Pass sections to reportBuilder as options
    - Validate section names against allowed sections
    - _Requirements: 8.1_
  
  - [x] 9.3 Integrate trend analysis into reports
    - Before generating report, call trendAnalysis.analyzeTrend for relevant metrics
    - Include trend results in consultation data passed to reportBuilder
    - Ensure trend section is conditionally included based on significance
    - _Requirements: 6.6_

- [x] 11. Implement frontend Patient History Viewer component
  - [x] 11.1 Create PatientHistoryViewer Angular component
    - Generate component: `ng generate component components/patient-history-viewer`
    - Create component template with sections for blood levels, sugar levels, other metrics, medical history
    - Add date range picker and metric type filter controls
    - _Requirements: 1.1, 1.2, 1.3, 1.7_
  
  - [x] 11.2 Implement history data service
    - Create `src/app/services/patient-history.service.ts`
    - Add method `getPatientHistory(patientId, filters)` calling GET /api/metrics/patient/:id/history
    - Add method `getPatientTrends(patientId, metricTypes, months)` calling GET /api/metrics/patient/:id/trends
    - Add method `getPatientSummary(patientId)` calling GET /api/metrics/patient/:id/summary
    - _Requirements: 1.1, 6.1, 7.1_
  
  - [x] 11.3 Display health metrics with visual indicators
    - Render metrics in organized tables grouped by category
    - Apply color coding: green (normal), yellow (borderline), red (out of range)
    - Display date, value, unit, and status for each metric
    - Show empty state message when no data exists
    - _Requirements: 1.4, 1.5, 1.6, 1.8_
  
  - [x] 11.4 Add filtering and date range selection
    - Implement date range picker using Angular Material or similar
    - Add metric type dropdown filter
    - Update displayed data when filters change
    - _Requirements: 1.7_

- [x] 21. Implement Admin Self-Service Appointment Booking
  - [x] 21.1 Create appointment booking interface for admins
    - Add appointment booking section to admin dashboard
    - Allow admin to select a doctor from dropdown
    - Display selected doctor's available time slots
    - Allow admin to select date and time
    - _Requirements: 13.1, 13.2_
  
  - [x] 21.2 Implement admin appointment booking backend
    - Create POST /api/appointments/admin endpoint to book appointments for admins
    - Verify admin is authenticated and has admin role
    - Verify selected doctor exists and is available at selected time
    - Create appointment with admin as patient
    - Associate appointment with admin's patient profile
    - Prevent double-booking of doctor time slots
    - _Requirements: 13.1, 13.2, 13.3, 13.6, 13.8_
  
  - [x] 21.3 Implement appointment confirmation notifications
    - Send confirmation email/notification to admin with appointment details
    - Send confirmation email/notification to doctor with appointment details
    - Include appointment date, time, and patient (admin) information
    - _Requirements: 13.4_
  
  - [x] 21.4 Add appointment confirmation UI
    - Display confirmation message after successful booking
    - Show appointment details: doctor name, date, time, location
    - Provide option to add appointment to calendar
    - _Requirements: 13.7_
  
  - [x] 21.5 Implement appointment availability verification
    - Check doctor's schedule to ensure no conflicts
    - Verify time slot is within doctor's working hours
    - Return error if time slot is unavailable
    - _Requirements: 13.6, 13.8_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Unit tests validate specific examples and edge cases using Jest
- Integration tests verify end-to-end flows across system components
- The implementation uses JavaScript/Node.js for backend and TypeScript/Angular for frontend
- All patient data access must be authorized and audited for privacy compliance
- AI services should degrade gracefully when external APIs are unavailable
