"""
Report Service - Consultation report generation
Generates comprehensive PDF reports with AI insights and patient data
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
import os

def get_openai_client():
    """Get OpenAI client (lazy load)"""
    from openai import OpenAI
    return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ReportService:
    """Service for generating consultation reports"""
    
    def __init__(self):
        self.page_size = letter
        self.margin = 0.5 * inch
    
    def generate_consultation_report(self, consultation_data: dict, patient_id: str, options: dict = None) -> bytes:
        """
        Generate a comprehensive consultation report
        
        Args:
            consultation_data: Dict with consultation details
            patient_id: Patient ID
            options: Report options (sections to include, etc.)
            
        Returns:
            PDF file as bytes
        """
        try:
            # Create PDF buffer
            pdf_buffer = io.BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=self.page_size,
                rightMargin=self.margin,
                leftMargin=self.margin,
                topMargin=self.margin,
                bottomMargin=self.margin
            )
            
            # Build document content
            story = []
            styles = self._get_styles()
            
            # Add header
            story.extend(self._build_header(consultation_data, styles))
            story.append(Spacer(1, 0.3 * inch))
            
            # Add patient information
            story.extend(self._build_patient_info(consultation_data, styles))
            story.append(Spacer(1, 0.2 * inch))
            
            # Add consultation details
            story.extend(self._build_consultation_details(consultation_data, styles))
            story.append(Spacer(1, 0.2 * inch))
            
            # Add health metrics if available
            if consultation_data.get('health_metrics'):
                story.extend(self._build_metrics_section(consultation_data['health_metrics'], styles))
                story.append(Spacer(1, 0.2 * inch))
            
            # Add AI insights
            if consultation_data.get('ai_insights'):
                story.extend(self._build_ai_insights(consultation_data['ai_insights'], styles))
                story.append(Spacer(1, 0.2 * inch))
            
            # Add diagnosis and treatment
            if consultation_data.get('diagnosis') or consultation_data.get('treatment_plan'):
                story.extend(self._build_diagnosis_treatment(consultation_data, styles))
                story.append(Spacer(1, 0.2 * inch))
            
            # Add medications
            if consultation_data.get('medications'):
                story.extend(self._build_medications_section(consultation_data['medications'], styles))
                story.append(Spacer(1, 0.2 * inch))
            
            # Add follow-up
            if consultation_data.get('follow_up'):
                story.extend(self._build_follow_up(consultation_data['follow_up'], styles))
                story.append(Spacer(1, 0.2 * inch))
            
            # Add footer
            story.extend(self._build_footer(styles))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF bytes
            pdf_buffer.seek(0)
            return pdf_buffer.getvalue()
            
        except Exception as e:
            raise ValueError(f"Failed to generate report: {str(e)}")
    
    def generate_ai_summary(self, consultation_data: dict, audience_type: str = 'patient') -> str:
        """
        Generate AI-powered summary of consultation
        
        Args:
            consultation_data: Consultation details
            audience_type: 'patient' for plain language, 'provider' for technical
            
        Returns:
            AI-generated summary text
        """
        try:
            client = get_openai_client()
            
            if audience_type == 'patient':
                prompt = f"""Please provide a plain-language summary of this consultation for a patient:
                
Symptoms: {consultation_data.get('symptoms', 'Not specified')}
Diagnosis: {consultation_data.get('diagnosis', 'Not specified')}
Treatment Plan: {consultation_data.get('treatment_plan', 'Not specified')}
Medications: {consultation_data.get('medications', 'Not specified')}

Make it easy to understand, avoid medical jargon, and include key points the patient should remember."""
            else:
                prompt = f"""Please provide a technical summary of this consultation for healthcare providers:
                
Symptoms: {consultation_data.get('symptoms', 'Not specified')}
Diagnosis: {consultation_data.get('diagnosis', 'Not specified')}
Treatment Plan: {consultation_data.get('treatment_plan', 'Not specified')}
Medications: {consultation_data.get('medications', 'Not specified')}
Health Metrics: {consultation_data.get('health_metrics', 'Not specified')}

Include clinical reasoning, relevant findings, and recommendations for follow-up care."""
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {'role': 'system', 'content': 'You are a medical documentation specialist.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Unable to generate summary: {str(e)}"
    
    def _get_styles(self) -> dict:
        """Get ReportLab styles"""
        styles = getSampleStyleSheet()
        
        # Custom styles
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=10,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=8
        ))
        
        return styles
    
    def _build_header(self, consultation_data: dict, styles: dict) -> list:
        """Build report header"""
        elements = []
        
        elements.append(Paragraph("CONSULTATION REPORT", styles['CustomTitle']))
        elements.append(Spacer(1, 0.1 * inch))
        
        # Report date
        report_date = datetime.now().strftime("%B %d, %Y")
        elements.append(Paragraph(f"<b>Report Date:</b> {report_date}", styles['Normal']))
        
        # Doctor info
        if consultation_data.get('doctor_name'):
            elements.append(Paragraph(f"<b>Doctor:</b> {consultation_data['doctor_name']}", styles['Normal']))
        
        return elements
    
    def _build_patient_info(self, consultation_data: dict, styles: dict) -> list:
        """Build patient information section"""
        elements = []
        
        elements.append(Paragraph("PATIENT INFORMATION", styles['SectionHeading']))
        
        patient_info = []
        if consultation_data.get('patient_name'):
            patient_info.append(['Name:', consultation_data['patient_name']])
        if consultation_data.get('patient_age'):
            patient_info.append(['Age:', str(consultation_data['patient_age'])])
        if consultation_data.get('patient_gender'):
            patient_info.append(['Gender:', consultation_data['patient_gender']])
        if consultation_data.get('patient_id'):
            patient_info.append(['Patient ID:', consultation_data['patient_id']])
        
        if patient_info:
            table = Table(patient_info, colWidths=[1.5*inch, 4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(table)
        
        return elements
    
    def _build_consultation_details(self, consultation_data: dict, styles: dict) -> list:
        """Build consultation details section"""
        elements = []
        
        elements.append(Paragraph("CONSULTATION DETAILS", styles['SectionHeading']))
        
        if consultation_data.get('symptoms'):
            elements.append(Paragraph("<b>Symptoms:</b>", styles['Normal']))
            elements.append(Paragraph(consultation_data['symptoms'], styles['BodyText']))
        
        if consultation_data.get('duration'):
            elements.append(Paragraph(f"<b>Consultation Duration:</b> {consultation_data['duration']}", styles['Normal']))
        
        if consultation_data.get('visit_type'):
            elements.append(Paragraph(f"<b>Visit Type:</b> {consultation_data['visit_type']}", styles['Normal']))
        
        return elements
    
    def _build_metrics_section(self, metrics: list, styles: dict) -> list:
        """Build health metrics section"""
        elements = []
        
        elements.append(Paragraph("HEALTH METRICS", styles['SectionHeading']))
        
        if metrics:
            metric_data = [['Metric', 'Value', 'Unit', 'Status']]
            for metric in metrics:
                metric_data.append([
                    metric.get('type', ''),
                    str(metric.get('value', '')),
                    metric.get('unit', ''),
                    metric.get('status', 'normal')
                ])
            
            table = Table(metric_data, colWidths=[2*inch, 1.5*inch, 1*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(table)
        
        return elements
    
    def _build_ai_insights(self, insights: str, styles: dict) -> list:
        """Build AI insights section"""
        elements = []
        
        elements.append(Paragraph("AI INSIGHTS & RECOMMENDATIONS", styles['SectionHeading']))
        elements.append(Paragraph(insights, styles['BodyText']))
        
        return elements
    
    def _build_diagnosis_treatment(self, consultation_data: dict, styles: dict) -> list:
        """Build diagnosis and treatment section"""
        elements = []
        
        elements.append(Paragraph("DIAGNOSIS & TREATMENT PLAN", styles['SectionHeading']))
        
        if consultation_data.get('diagnosis'):
            elements.append(Paragraph("<b>Diagnosis:</b>", styles['Normal']))
            elements.append(Paragraph(consultation_data['diagnosis'], styles['BodyText']))
        
        if consultation_data.get('treatment_plan'):
            elements.append(Paragraph("<b>Treatment Plan:</b>", styles['Normal']))
            elements.append(Paragraph(consultation_data['treatment_plan'], styles['BodyText']))
        
        return elements
    
    def _build_medications_section(self, medications: list, styles: dict) -> list:
        """Build medications section"""
        elements = []
        
        elements.append(Paragraph("MEDICATIONS", styles['SectionHeading']))
        
        if medications:
            med_data = [['Medication', 'Dosage', 'Frequency', 'Duration']]
            for med in medications:
                med_data.append([
                    med.get('name', ''),
                    med.get('dosage', ''),
                    med.get('frequency', ''),
                    med.get('duration', '')
                ])
            
            table = Table(med_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            elements.append(table)
        
        return elements
    
    def _build_follow_up(self, follow_up: dict, styles: dict) -> list:
        """Build follow-up section"""
        elements = []
        
        elements.append(Paragraph("FOLLOW-UP INSTRUCTIONS", styles['SectionHeading']))
        
        if follow_up.get('next_appointment'):
            elements.append(Paragraph(f"<b>Next Appointment:</b> {follow_up['next_appointment']}", styles['Normal']))
        
        if follow_up.get('instructions'):
            elements.append(Paragraph("<b>Instructions:</b>", styles['Normal']))
            elements.append(Paragraph(follow_up['instructions'], styles['BodyText']))
        
        if follow_up.get('warnings'):
            elements.append(Paragraph("<b>Important Warnings:</b>", styles['Normal']))
            elements.append(Paragraph(follow_up['warnings'], styles['BodyText']))
        
        return elements
    
    def _build_footer(self, styles: dict) -> list:
        """Build report footer"""
        elements = []
        
        elements.append(Spacer(1, 0.3 * inch))
        
        footer_text = "This report is confidential and intended for the patient and healthcare providers only. " \
                     "All information contained herein is based on the consultation and should not be considered a substitute for professional medical advice."
        
        elements.append(Paragraph(footer_text, styles['Normal']))
        
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        
        return elements

# Create singleton instance
report_service = ReportService()
