import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { PatientDoctorProfileComponent } from './patient-doctor-profile.component';
import { PatientDoctorService } from '../../services/patient-doctor.service';
import { of, throwError } from 'rxjs';

describe('PatientDoctorProfileComponent', () => {
  let component: PatientDoctorProfileComponent;
  let fixture: ComponentFixture<PatientDoctorProfileComponent>;
  let doctorService: PatientDoctorService;
  let activatedRoute: ActivatedRoute;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    specialty: 'Cardiology',
    specialtyKey: 'cardiology',
    avatar: 'avatar.jpg',
    photo: 'photo.jpg',
    rating: 4.5,
    reviewCount: 120,
    experience: 10,
    city: 'New York',
    location: 'Manhattan',
    address: '123 Main St',
    languages: ['English', 'Spanish'],
    bio: 'Experienced cardiologist with 10 years of practice',
    consultationFee: 100,
    nextAvailable: 'Today',
    verified: true,
    online: true,
    waitTime: '15 mins',
    insurances: ['Blue Cross'],
    education: ['MD from Harvard', 'Board Certified'],
    clinicName: 'Heart Clinic',
    availability: []
  };

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

  const mockReviews = [
    {
      id: '1',
      rating: 5,
      comment: 'Excellent doctor!',
      patientName: 'John Doe',
      patientAvatar: 'avatar.jpg',
      visitType: 'in-person',
      createdAt: '2024-01-10'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDoctorProfileComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        PatientDoctorService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? '1' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDoctorProfileComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(PatientDoctorService);
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load doctor profile, availability, and reviews', () => {
      spyOn(doctorService, 'getDoctorProfile').and.returnValue(of(mockDoctor));
      spyOn(doctorService, 'getDoctorAvailability').and.returnValue(of(mockAvailability));
      spyOn(doctorService, 'getDoctorReviews').and.returnValue(of(mockReviews));

      component.ngOnInit();

      expect(doctorService.getDoctorProfile).toHaveBeenCalledWith('1');
      expect(doctorService.getDoctorAvailability).toHaveBeenCalledWith('1');
      expect(doctorService.getDoctorReviews).toHaveBeenCalledWith('1');
      expect(component.doctor).toEqual(mockDoctor);
      expect(component.availability).toEqual(mockAvailability);
      expect(component.reviews).toEqual(mockReviews);
    });

    it('should handle error when loading doctor profile', () => {
      spyOn(doctorService, 'getDoctorProfile').and.returnValue(
        throwError(() => new Error('Network error'))
      );
      spyOn(doctorService, 'getDoctorAvailability').and.returnValue(of(mockAvailability));
      spyOn(doctorService, 'getDoctorReviews').and.returnValue(of(mockReviews));

      component.ngOnInit();

      expect(component.error).toBeTruthy();
    });
  });

  describe('openBookingForm', () => {
    it('should open booking form', () => {
      component.openBookingForm();

      expect(component.showBookingForm).toBe(true);
    });
  });

  describe('closeBookingForm', () => {
    it('should close booking form and reset values', () => {
      component.showBookingForm = true;
      component.selectedDate = '2024-01-15';
      component.selectedTime = '09:00';

      component.closeBookingForm();

      expect(component.showBookingForm).toBe(false);
      expect(component.selectedDate).toBe('');
      expect(component.selectedTime).toBe('');
      expect(component.availableSlots).toEqual([]);
    });
  });

  describe('onDateSelected', () => {
    beforeEach(() => {
      component.availability = mockAvailability;
    });

    it('should populate available slots for selected date', () => {
      component.selectedDate = '2024-01-15';

      component.onDateSelected();

      expect(component.availableSlots.length).toBe(2);
      expect(component.availableSlots[0].time).toBe('09:00');
    });

    it('should return empty slots if date not found', () => {
      component.selectedDate = '2024-01-20';

      component.onDateSelected();

      expect(component.availableSlots).toEqual([]);
    });

    it('should not populate slots if no date selected', () => {
      component.selectedDate = '';

      component.onDateSelected();

      expect(component.availableSlots).toEqual([]);
    });
  });

  describe('bookAppointment', () => {
    beforeEach(() => {
      component.doctor = mockDoctor;
    });

    it('should book appointment successfully', () => {
      spyOn(doctorService, 'bookAppointment').and.returnValue(of({ id: '1' }));
      spyOn(component['router'], 'navigate');
      spyOn(window, 'alert');

      component.selectedDate = '2024-01-15';
      component.selectedTime = '09:00';

      component.bookAppointment();

      expect(doctorService.bookAppointment).toHaveBeenCalledWith({
        doctorId: mockDoctor.id,
        date: '2024-01-15',
        time: '09:00',
        type: 'in-person'
      });
      expect(window.alert).toHaveBeenCalledWith('Appointment booked successfully!');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/patient/my-appointments']);
    });

    it('should show error if date or time not selected', () => {
      spyOn(window, 'alert');

      component.selectedDate = '';
      component.selectedTime = '';

      component.bookAppointment();

      expect(window.alert).toHaveBeenCalledWith('Please select a date and time');
    });

    it('should handle booking error', () => {
      spyOn(doctorService, 'bookAppointment').and.returnValue(
        throwError(() => ({ error: { message: 'Slot unavailable' } }))
      );
      spyOn(window, 'alert');

      component.selectedDate = '2024-01-15';
      component.selectedTime = '09:00';

      component.bookAppointment();

      expect(window.alert).toHaveBeenCalledWith('Failed to book appointment: Slot unavailable');
    });
  });

  describe('getRatingStars', () => {
    it('should return correct number of stars', () => {
      expect(component.getRatingStars(4.5).length).toBe(4);
      expect(component.getRatingStars(5).length).toBe(5);
    });
  });

  describe('getReviewStars', () => {
    it('should return correct number of stars for review rating', () => {
      expect(component.getReviewStars(5).length).toBe(5);
      expect(component.getReviewStars(3).length).toBe(3);
    });
  });
});
