"""
Report Builder Service - Generates AI-powered medical reports with OpenAI integration
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['healthai']

# OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ReportBuilderService:
    """Service for generating AI-powered medical reports"""
    
    def __init__(self):
        self.health_metrics_collection = db['healthmetrics']
        self.users_collection = db['users']
    
    def generate_consultation_report(
        self,
        consultation_data: Dict,
        patient_id: str,
        options: Optional[Dict] = None
    ) -> bytes:
        """
        Generates complete consultation report as PDF
        
        Args:
            consultation_data: Consultation details
            patient_id: Patient's MongoDB ObjectId
            options: Report options (sections, includeTrends)
            
        Returns:
            PDF file as bytes
        """
        if options is None:
            options = {}
        
        sections = options.get('sections', ['all'])
        include_trends = options.get('includeTrends', True)
        
        try:
            # Load patient data
            patient = self.users_collection.find_one(
                {'_id': patient_id},
                {'name': 1, 'email': 1, 'dateOfBirth': 1, 'gender': 1, 'phone': 1}
            )
            
            if not patient:
                raise ValueError('Patient not found')
            
            # Load doctor data
            doctor = None
            if consultation_data.get('doctorId'):
                doctor = self.users_collection.find_one(
                    {'_id': consultation_data['doctorId']},
                    {'name': 1, 'specialty': 1}
                )
            
            # Load relevant health metrics
            start_date = consultation_data.get('startDate', datetime.now() - timedelta(days=7))
            end_date = consultation_data.get('endDate', datetime.now())
            
            metrics = list(self.health_metrics_collection.find(
                {
                    'patientId': patient_id,
                    'recordedAt': {'$gte': start_date, '$lte': end_date}
                },
                sort=[('recordedAt', -1)]
            ))
            
            # Generate AI summaries
            patient_summary = self._generate_ai_summary(consultation_data, 'patient')
            provider_summary = self._generate_ai_summary(consultation_data, 'provider')
            
            # Create PDF
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
            
            story = []
            styles = getSampleStyleSheet()
            
            # Add sections
            if self._should_include_section('demographics', sections):
                story.extend(self._add_demographics_section(patient, doctor, consultation_data, styles))
            
            if self._should_include_section('symptoms', sections) and consultation_data.get('symptoms'):
                story.extend(self._add_symptoms_section(consultation_data['symptoms'], styles))
            
            if self._should_include_section('diagnoses', sections) and consultation_data.get('diagnoses'):
                story.extend(self._add_diagnoses_section(consultation_data['diagnoses'], styles))
            
            if self._should_include_section('metrics', sections) and metrics:
                story.extend(self._add_metrics_section(metrics, patient.get('gender'), styles))
            
            if self._should_include_section('ai_insights', sections):
                story.extend(self._add_ai_insights_section(
                    patient_summary, provider_summary, consultation_data.get('aiInsights'), styles
                ))
            
            if self._should_include_section('medications', sections) and consultation_data.get('medications'):
                story.extend(self._add_medications_section(consultation_data['medications'], styles))
            
            if self._should_include_section('followup', sections) and consultation_data.get('followUp'):
                story.extend(self._add_followup_section(consultation_data['followUp'], styles))
            
            if self._should_include_section('trends', sections) and include_trends and consultation_data.get('trends'):
                story.extend(self._add_trends_section(consultation_data['trends'], styles))
            
            # Build PDF
            doc.build(story)
            pdf_buffer.seek(0)
            
            return pdf_buffer.getvalue()
            
        except Exception as e:
            print(f'Error generating consultation report: {str(e)}')
            raise
    
    def _generate_ai_summary(self, consultation_data: Dict, audience_type: str) -> str:
        """
        Generates AI-powered summary using OpenAI GPT-4
        
        Args:
            consultation_data: Consultation details
            audience_type: "patient" or "provider"
            
        Returns:
            AI-generated summary
        """
        try:
            if audience_type == 'patient':
                prompt = f"""Summarize the following medical consultation in simple, patient-friendly language:

Symptoms: {consultation_data.get('symptoms', 'None reported')}
Diagnoses: {consultation_data.get('diagnoses', 'None')}
Key Findings: {consultation_data.get('keyFindings', 'None')}

Provide a brief, reassuring summary that a patient can understand."""
            else:
                prompt = f"""Provide a technical medical summary of this consultation for healthcare providers:

Symptoms: {consultation_data.get('symptoms', 'None reported')}
Diagnoses: {consultation_data.get('diagnoses', 'None')}
Key Findings: {consultation_data.get('keyFindings', 'None')}
Treatment Plan: {consultation_data.get('treatmentPlan', 'None')}

Include clinical observations and recommendations."""
            
            response = openai_client.chat.completions.create(
                model='gpt-4',
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a medical documentation assistant. Provide clear, accurate summaries.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f'Error generating AI summary: {str(e)}')
            return 'Summary unavailable at this time.' if audience_type == 'patient' else 'Technical summary unavailable.'
    
    def _format_metrics_for_report(self, metrics: List[Dict]) -> List[List[str]]:
        """Format metrics for report tables"""
        from utils.clinical_ranges import is_out_of_range
        
        table_data = []
        for metric in metrics:
            date = metric.get('recordedAt')
            if isinstance(date, datetime):
                date = date.strftime('%Y-%m-%d')
            
            value = metric.get('value')
            if metric.get('value2'):
                value = f"{metric.get('value')}/{metric.get('value2')}"
            
            metric_type = metric.get('type', '').replace('_', ' ').upper()
            unit = metric.get('unit', '')
            
            range_check = is_out_of_range(metric.get('type'), metric.get('value'), 'male', metric.get('value2'))
            status = 'Normal' if range_check['inRange'] else range_check.get('severity', 'Abnormal').upper()
            
            table_data.append([date, metric_type, str(value), unit, status])
        
        return table_data
    
    def _should_include_section(self, section_name: str, sections: List[str]) -> bool:
        """Check if section should be included"""
        return 'all' in sections or section_name in sections
    
    def _add_demographics_section(self, patient: Dict, doctor: Optional[Dict], consultation_data: Dict, styles) -> List:
        """Add demographics section to report"""
        story = []
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=12,
            alignment=1  # Center
        )
        
        story.append(Paragraph('Consultation Report', title_style))
        story.append(Spacer(1, 0.3*inch))
        
        dob = patient.get('dateOfBirth')
        if isinstance(dob, datetime):
            dob = dob.strftime('%Y-%m-%d')
        
        demographics_text = f"""
        <b>Patient:</b> {patient.get('name')}<br/>
        <b>Date of Birth:</b> {dob or 'N/A'}<br/>
        <b>Gender:</b> {patient.get('gender', 'N/A')}<br/>
        <b>Contact:</b> {patient.get('phone') or patient.get('email') or 'N/A'}<br/>
        """
        
        if doctor:
            demographics_text += f"""
            <b>Doctor:</b> {doctor.get('name')}<br/>
            <b>Specialization:</b> {doctor.get('specialty', 'General Practice')}<br/>
            """
        
        consultation_date = consultation_data.get('date', datetime.now())
        if isinstance(consultation_date, datetime):
            consultation_date = consultation_date.strftime('%Y-%m-%d')
        
        demographics_text += f"<b>Consultation Date:</b> {consultation_date}"
        
        story.append(Paragraph(demographics_text, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        return story
    
    def _add_symptoms_section(self, symptoms: str, styles) -> List:
        """Add symptoms section"""
        story = []
        story.append(Paragraph('<b>Symptoms</b>', styles['Heading2']))
        story.append(Paragraph(symptoms, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_diagnoses_section(self, diagnoses: str, styles) -> List:
        """Add diagnoses section"""
        story = []
        story.append(Paragraph('<b>Diagnoses</b>', styles['Heading2']))
        story.append(Paragraph(diagnoses, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_metrics_section(self, metrics: List[Dict], gender: Optional[str], styles) -> List:
        """Add health metrics section"""
        story = []
        story.append(Paragraph('<b>Health Metrics</b>', styles['Heading2']))
        
        table_data = [['Date', 'Metric', 'Value', 'Unit', 'Status']]
        table_data.extend(self._format_metrics_for_report(metrics))
        
        table = Table(table_data, colWidths=[1.2*inch, 1.5*inch, 1*inch, 0.8*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_ai_insights_section(self, patient_summary: str, provider_summary: str, ai_insights: Optional[List], styles) -> List:
        """Add AI insights section"""
        story = []
        story.append(Paragraph('<b>AI-Generated Insights</b>', styles['Heading2']))
        
        story.append(Paragraph('<u>Patient Summary:</u>', styles['Normal']))
        story.append(Paragraph(patient_summary, styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        
        story.append(Paragraph('<u>Clinical Summary:</u>', styles['Normal']))
        story.append(Paragraph(provider_summary, styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        
        if ai_insights:
            story.append(Paragraph('<u>Additional AI Insights:</u>', styles['Normal']))
            for insight in ai_insights:
                story.append(Paragraph(f'• {insight}', styles['Normal']))
        
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_medications_section(self, medications: str, styles) -> List:
        """Add medications section"""
        story = []
        story.append(Paragraph('<b>Medications & Treatment Plan</b>', styles['Heading2']))
        story.append(Paragraph(medications, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_followup_section(self, followup: str, styles) -> List:
        """Add follow-up section"""
        story = []
        story.append(Paragraph('<b>Follow-Up Instructions</b>', styles['Heading2']))
        story.append(Paragraph(followup, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        return story
    
    def _add_trends_section(self, trends: List[Dict], styles) -> List:
        """Add trends section"""
        story = []
        story.append(Paragraph('<b>Health Trends Analysis</b>', styles['Heading2']))
        
        for trend in trends:
            if trend.get('clinicalSignificance') != 'low':
                metric_type = trend.get('metricType', '').replace('_', ' ').upper()
                change = trend.get('changePercent', 0)
                trend_direction = trend.get('trend', 'stable')
                
                trend_text = f"{metric_type}: {trend_direction} ({change}% change)"
                story.append(Paragraph(trend_text, styles['Normal']))
                
                if trend.get('alert'):
                    alert = trend['alert']
                    story.append(Paragraph(f"<i>Alert: {alert.get('message')}</i>", styles['Normal']))
                    story.append(Paragraph(f"<i>Recommendation: {alert.get('recommendation')}</i>", styles['Normal']))
                
                story.append(Spacer(1, 0.1*inch))
        
        return story


# Singleton instance
report_builder_service = ReportBuilderService()
