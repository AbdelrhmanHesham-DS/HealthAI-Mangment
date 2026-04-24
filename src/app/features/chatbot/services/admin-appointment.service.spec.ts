import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminAppointmentService } from './admin-appointment.service';

describe('AdminAppointmentService', () => {
  let service: AdminAppointmentService;
  let httpMock: HttpTestingController;
  const API = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminAppointmentService]
    });

    service = TestBed.inject(AdminAppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDoctorList', () => {
    it('should fetch list of doctors', () => {
      const mockDoctors = [
        {
          id: 'doc-1',
          name: 'Dr. Smith',
          specialty: 'Cardiology',
          avatar: 'avatar.jpg',
          photo: 'photo.jpg',
          rating: 4.5,
          consultationFee: 100,
          availability: []
        },
        {
          id: 'doc-2',
          name: 'Dr. Johnson',
          specialty: 'Neurology',
          avatar: 'avatar2.jpg',
          photo: 'photo2.jpg',
          rating: 4.8,
          consultationFee: 120,
          availability: []
        }
      ];

      service.getDoctorList().subscribe(doctors => {
        expect(doctors.length).toBe(2);
        expect(doctors[0].name).toBe('Dr. Smith');
        expect(doctors[1].name).toBe('Dr. Johnson');
      });

      const req = httpMock.expectOne(`${API}/doctors`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctors);
    });

    it('should handle error when fetching doctors', () => {
      service.getDoctorList().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${API}/doctors`);
      req.flush('Server error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getDoctorAvailability', () => {
    it('should fetch doctor availability', () => {
      const doctorId = 'doc-1';
      const mockAvailability = {
        doctorId: 'doc-1',
        name: 'Dr. Smith',
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

      service.getDoctorAvailability(doctorId).subscribe(availability => {
        expect(availability.doctorId).toBe('doc-1');
        expect(availability.availability.length).toBe(1);
        expect(availability.availability[0].slots.length).toBe(2);
      });

      const req = httpMock.expectOne(`${API}/doctors/${doctorId}/availability`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAvailability);
    });

    it('should handle error when fetching availability', () => {
      const doctorId = 'doc-1';

      service.getDoctorAvailability(doctorId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${API}/doctors/${doctorId}/availability`);
      req.flush('Doctor not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('bookAdminAppointment', () => {
    it('should book appointment successfully', () => {
      const appointmentData = {
        doctorId: 'doc-1',
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1',
        type: 'in-person',
        reason: 'Regular checkup'
      };

      const mockResponse = {
        id: 'apt-1',
        doctorId: 'doc-1',
        patientId: 'admin-1',
        doctorName: 'Dr. Smith',
        patientName: 'Admin User',
        date: '2024-01-20',
        time: '10:00',
        type: 'in-person',
        status: 'upcoming',
        fee: 100
      };

      service.bookAdminAppointment(appointmentData).subscribe(appointment => {
        expect(appointment.id).toBe('apt-1');
        expect(appointment.doctorId).toBe('doc-1');
        expect(appointment.status).toBe('upcoming');
        expect(appointment.date).toBe('2024-01-20');
        expect(appointment.time).toBe('10:00');
      });

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(appointmentData);
      req.flush(mockResponse);
    });

    it('should handle conflict error when slot is already booked', () => {
      const appointmentData = {
        doctorId: 'doc-1',
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1'
      };

      service.bookAdminAppointment(appointmentData).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(409);
        }
      );

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      req.flush('This time slot has already been booked', { status: 409, statusText: 'Conflict' });
    });

    it('should handle error when doctor not found', () => {
      const appointmentData = {
        doctorId: 'non-existent',
        date: '2024-01-20',
        time: '10:00'
      };

      service.bookAdminAppointment(appointmentData).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      req.flush('Doctor not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle error when time slot is unavailable', () => {
      const appointmentData = {
        doctorId: 'doc-1',
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1'
      };

      service.bookAdminAppointment(appointmentData).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(409);
        }
      );

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      req.flush('This time slot is not available', { status: 409, statusText: 'Conflict' });
    });

    it('should handle authorization error for non-admin users', () => {
      const appointmentData = {
        doctorId: 'doc-1',
        date: '2024-01-20',
        time: '10:00'
      };

      service.bookAdminAppointment(appointmentData).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      req.flush('Only admins can book appointments for themselves', { status: 403, statusText: 'Forbidden' });
    });

    it('should include all appointment details in request', () => {
      const appointmentData = {
        doctorId: 'doc-1',
        date: '2024-01-20',
        time: '10:00',
        slotId: 'slot-1',
        type: 'video',
        reason: 'Follow-up consultation'
      };

      service.bookAdminAppointment(appointmentData).subscribe();

      const req = httpMock.expectOne(`${API}/appointments/admin`);
      expect(req.request.body.doctorId).toBe('doc-1');
      expect(req.request.body.date).toBe('2024-01-20');
      expect(req.request.body.time).toBe('10:00');
      expect(req.request.body.slotId).toBe('slot-1');
      expect(req.request.body.type).toBe('video');
      expect(req.request.body.reason).toBe('Follow-up consultation');
      req.flush({});
    });
  });
});
