import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PatientDoctorService } from './patient-doctor.service';

describe('PatientDoctorService', () => {
  let service: PatientDoctorService;
  let httpMock: HttpTestingController;
  const API = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PatientDoctorService]
    });
    service = TestBed.inject(PatientDoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDoctorList', () => {
    it('should fetch all doctors', () => {
      const mockDoctors = [
        { id: '1', name: 'Dr. Smith', specialty: 'Cardiology', rating: 4.5 },
        { id: '2', name: 'Dr. Jones', specialty: 'Neurology', rating: 4.8 }
      ];

      service.getDoctorList().subscribe(doctors => {
        expect(doctors.length).toBe(2);
        expect(doctors[0].name).toBe('Dr. Smith');
      });

      const req = httpMock.expectOne(`${API}/doctors`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctors);
    });

    it('should fetch doctors with filters', () => {
      const filters = { specialty: 'Cardiology', minRating: 4 };
      const mockDoctors = [
        { id: '1', name: 'Dr. Smith', specialty: 'Cardiology', rating: 4.5 }
      ];

      service.getDoctorList(filters).subscribe(doctors => {
        expect(doctors.length).toBe(1);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${API}/doctors` && 
        req.params.has('specialty') && 
        req.params.has('minRating')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctors);
    });
  });

  describe('getDoctorProfile', () => {
    it('should fetch doctor profile by ID', () => {
      const doctorId = '1';
      const mockDoctor = {
        id: '1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        bio: 'Experienced cardiologist',
        rating: 4.5
      };

      service.getDoctorProfile(doctorId).subscribe(doctor => {
        expect(doctor.name).toBe('Dr. Smith');
        expect(doctor.specialty).toBe('Cardiology');
      });

      const req = httpMock.expectOne(`${API}/doctors/${doctorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctor);
    });
  });

  describe('getDoctorAvailability', () => {
    it('should fetch doctor availability', () => {
      const doctorId = '1';
      const mockAvailability = {
        doctorId: '1',
        name: 'Dr. Smith',
        availability: [
          {
            day: 'Monday',
            date: '2024-01-15',
            slots: [
              { id: '1', time: '09:00', available: true },
              { id: '2', time: '10:00', available: true }
            ]
          }
        ]
      };

      service.getDoctorAvailability(doctorId).subscribe(availability => {
        expect(availability.availability.length).toBe(1);
        expect(availability.availability[0].slots.length).toBe(2);
      });

      const req = httpMock.expectOne(`${API}/doctors/${doctorId}/availability`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAvailability);
    });
  });

  describe('getDoctorReviews', () => {
    it('should fetch doctor reviews', () => {
      const doctorId = '1';
      const mockReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Great doctor!',
          patientName: 'John Doe',
          createdAt: '2024-01-10'
        }
      ];

      service.getDoctorReviews(doctorId).subscribe(reviews => {
        expect(reviews.length).toBe(1);
        expect(reviews[0].rating).toBe(5);
      });

      const req = httpMock.expectOne(`${API}/doctors/${doctorId}/reviews`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReviews);
    });
  });

  describe('bookAppointment', () => {
    it('should book an appointment', () => {
      const appointmentData = {
        doctorId: '1',
        date: '2024-01-15',
        time: '09:00',
        type: 'in-person'
      };

      service.bookAppointment(appointmentData).subscribe(response => {
        expect(response.id).toBeDefined();
      });

      const req = httpMock.expectOne(`${API}/appointments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(appointmentData);
      req.flush({ id: '1', ...appointmentData });
    });
  });

  describe('submitReview', () => {
    it('should submit a review', () => {
      const reviewData = {
        doctorId: '1',
        rating: 5,
        comment: 'Excellent service'
      };

      service.submitReview(reviewData).subscribe(response => {
        expect(response.id).toBeDefined();
      });

      const req = httpMock.expectOne(`${API}/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reviewData);
      req.flush({ id: '1', ...reviewData });
    });
  });
});
