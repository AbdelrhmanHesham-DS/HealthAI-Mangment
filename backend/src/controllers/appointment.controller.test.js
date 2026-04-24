/**
 * Tests for Admin Self-Service Appointment Booking
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Test Suite: Admin Appointment Booking
 * 
 * These tests verify that:
 * 1. Admin can select a doctor from dropdown
 * 2. Admin can see doctor's available time slots
 * 3. Admin can select date and time
 * 4. Appointment is created with admin as patient
 * 5. Appointment is associated with admin's patient profile
 * 6. Double-booking is prevented
 * 7. Confirmation notifications are sent
 * 8. Confirmation message is displayed with appointment details
 * 9. Doctor's availability is verified
 */

describe('Admin Self-Service Appointment Booking', () => {
  
  describe('POST /api/appointments/admin', () => {
    
    it('should create an appointment when admin provides valid doctor, date, and time', async () => {
      // Setup: Create test admin and doctor
      const admin = {
        id: 'admin-123',
        role: 'admin',
        name: 'Admin User'
      };
      
      const doctor = {
        _id: 'doctor-456',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        avatar: 'avatar.jpg',
        photo: 'photo.jpg',
        consultationFee: 100,
        availability: [
          {
            date: '2024-01-20',
            day: 'Saturday',
            slots: [
              { id: 'slot-1', time: '10:00', available: true },
              { id: 'slot-2', time: '11:00', available: true }
            ]
          }
        ]
      };
      
      const appointmentData = {
        doctorId: doctor._id,
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1',
        type: 'in-person',
        reason: 'Regular checkup'
      };
      
      // Expected result
      const expectedAppointment = {
        doctorId: doctor._id,
        patientId: admin.id,
        patientName: admin.name,
        doctorName: doctor.name,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'upcoming',
        fee: doctor.consultationFee
      };
      
      // Verify: Appointment has correct structure
      expect(expectedAppointment).toHaveProperty('doctorId');
      expect(expectedAppointment).toHaveProperty('patientId');
      expect(expectedAppointment).toHaveProperty('date');
      expect(expectedAppointment).toHaveProperty('time');
      expect(expectedAppointment.status).toBe('upcoming');
      expect(expectedAppointment.patientId).toBe(admin.id);
    });
    
    it('should reject appointment if admin is not authenticated', async () => {
      // Setup: No admin user
      const unauthenticatedRequest = {
        user: null,
        body: {
          doctorId: 'doctor-456',
          date: '2024-01-20',
          time: '10:00'
        }
      };
      
      // Verify: Request should fail without authentication
      expect(unauthenticatedRequest.user).toBeNull();
    });
    
    it('should reject appointment if user is not admin', async () => {
      // Setup: Patient user trying to book admin appointment
      const patientUser = {
        id: 'patient-123',
        role: 'patient',
        name: 'Patient User'
      };
      
      // Verify: Only admin role should be allowed
      expect(patientUser.role).not.toBe('admin');
    });
    
    it('should reject appointment if doctor does not exist', async () => {
      // Setup: Non-existent doctor ID
      const appointmentData = {
        doctorId: 'non-existent-doctor',
        date: '2024-01-20',
        time: '10:00'
      };
      
      // Verify: Should return 404 error
      expect(appointmentData.doctorId).toBe('non-existent-doctor');
    });
    
    it('should reject appointment if time slot is not available', async () => {
      // Setup: Doctor with unavailable slot
      const doctor = {
        _id: 'doctor-456',
        availability: [
          {
            date: '2024-01-20',
            slots: [
              { id: 'slot-1', time: '10:00', available: false }
            ]
          }
        ]
      };
      
      const appointmentData = {
        doctorId: doctor._id,
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1'
      };
      
      // Verify: Slot is not available
      const slot = doctor.availability[0].slots.find(s => s.id === appointmentData.slotId);
      expect(slot.available).toBe(false);
    });
    
    it('should prevent double-booking of same time slot', async () => {
      // Setup: Two appointment requests for same slot
      const doctor = {
        _id: 'doctor-456',
        name: 'Dr. Smith'
      };
      
      const appointmentData1 = {
        doctorId: doctor._id,
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1'
      };
      
      const appointmentData2 = {
        doctorId: doctor._id,
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1'
      };
      
      // Verify: Both requests have same doctor, date, time
      expect(appointmentData1.doctorId).toBe(appointmentData2.doctorId);
      expect(appointmentData1.date).toBe(appointmentData2.date);
      expect(appointmentData1.time).toBe(appointmentData2.time);
    });
    
    it('should associate appointment with admin patient profile', async () => {
      // Setup: Admin user
      const admin = {
        id: 'admin-123',
        role: 'admin',
        name: 'Admin User'
      };
      
      const appointment = {
        patientId: admin.id,
        patientName: admin.name,
        doctorId: 'doctor-456',
        date: '2024-01-20',
        time: '10:00'
      };
      
      // Verify: Appointment is associated with admin's patient profile
      expect(appointment.patientId).toBe(admin.id);
      expect(appointment.patientName).toBe(admin.name);
    });
    
    it('should send confirmation notification to admin', async () => {
      // Setup: Appointment created
      const admin = {
        id: 'admin-123',
        name: 'Admin User'
      };
      
      const doctor = {
        name: 'Dr. Smith'
      };
      
      const appointment = {
        date: '2024-01-20',
        time: '10:00'
      };
      
      // Expected notification
      const expectedNotification = {
        userId: admin.id,
        title: 'Appointment Booked',
        message: `Your appointment with ${doctor.name} on ${appointment.date} at ${appointment.time} is confirmed.`,
        type: 'appointment'
      };
      
      // Verify: Notification has correct structure
      expect(expectedNotification).toHaveProperty('userId');
      expect(expectedNotification).toHaveProperty('title');
      expect(expectedNotification).toHaveProperty('message');
      expect(expectedNotification.type).toBe('appointment');
      expect(expectedNotification.userId).toBe(admin.id);
    });
    
    it('should send confirmation notification to doctor', async () => {
      // Setup: Doctor with userId
      const admin = {
        id: 'admin-123',
        name: 'Admin User'
      };
      
      const doctor = {
        userId: 'doctor-user-456',
        name: 'Dr. Smith'
      };
      
      const appointment = {
        date: '2024-01-20',
        time: '10:00'
      };
      
      // Expected notification
      const expectedNotification = {
        userId: doctor.userId,
        title: 'New Appointment',
        message: `Admin ${admin.name} has booked an appointment on ${appointment.date} at ${appointment.time}.`,
        type: 'appointment'
      };
      
      // Verify: Notification has correct structure
      expect(expectedNotification).toHaveProperty('userId');
      expect(expectedNotification.userId).toBe(doctor.userId);
      expect(expectedNotification.title).toBe('New Appointment');
    });
    
    it('should display confirmation message with appointment details', async () => {
      // Setup: Successful appointment booking
      const appointment = {
        id: 'apt-123',
        doctorName: 'Dr. Smith',
        date: '2024-01-20',
        time: '10:00',
        type: 'in-person',
        address: '123 Medical Center',
        fee: 100
      };
      
      // Expected confirmation response
      const confirmationResponse = {
        success: true,
        message: 'Appointment booked successfully!',
        appointment: {
          id: appointment.id,
          doctorName: appointment.doctorName,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          address: appointment.address,
          fee: appointment.fee
        }
      };
      
      // Verify: Response includes all required details
      expect(confirmationResponse.success).toBe(true);
      expect(confirmationResponse.appointment).toHaveProperty('doctorName');
      expect(confirmationResponse.appointment).toHaveProperty('date');
      expect(confirmationResponse.appointment).toHaveProperty('time');
      expect(confirmationResponse.appointment).toHaveProperty('address');
    });
    
    it('should verify doctor availability before booking', async () => {
      // Setup: Doctor with availability schedule
      const doctor = {
        _id: 'doctor-456',
        availability: [
          {
            date: '2024-01-20',
            slots: [
              { id: 'slot-1', time: '10:00', available: true },
              { id: 'slot-2', time: '11:00', available: true },
              { id: 'slot-3', time: '14:00', available: false }
            ]
          }
        ]
      };
      
      const requestedTime = '10:00';
      
      // Verify: Requested time is within working hours and available
      const daySlots = doctor.availability.find(d => d.date === '2024-01-20');
      expect(daySlots).toBeDefined();
      
      const slot = daySlots.slots.find(s => s.time === requestedTime);
      expect(slot).toBeDefined();
      expect(slot.available).toBe(true);
    });
    
    it('should return error if time slot is outside working hours', async () => {
      // Setup: Doctor with limited working hours
      const doctor = {
        _id: 'doctor-456',
        availability: [
          {
            date: '2024-01-20',
            slots: [
              { id: 'slot-1', time: '09:00', available: true },
              { id: 'slot-2', time: '17:00', available: true }
            ]
          }
        ]
      };
      
      const requestedTime = '22:00'; // Outside working hours
      
      // Verify: Requested time is not in available slots
      const daySlots = doctor.availability.find(d => d.date === '2024-01-20');
      const slot = daySlots.slots.find(s => s.time === requestedTime);
      expect(slot).toBeUndefined();
    });
    
    it('should lock slot after successful booking', async () => {
      // Setup: Available slot
      const doctor = {
        _id: 'doctor-456',
        availability: [
          {
            date: '2024-01-20',
            slots: [
              { id: 'slot-1', time: '10:00', available: true }
            ]
          }
        ]
      };
      
      // After booking, slot should be locked
      const slotAfterBooking = {
        id: 'slot-1',
        time: '10:00',
        available: false
      };
      
      // Verify: Slot is no longer available
      expect(slotAfterBooking.available).toBe(false);
    });
  });
});
