import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAppointmentBookingComponent } from './admin-appointment-booking.component';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { of, throwError } from 'rxjs';

describe('AdminAppointmentBookingComponent', () => {
  let component: AdminAppointmentBookingComponent;
  let fixture: ComponentFixture<AdminAppointmentBookingComponent>;
  let appointmentService: jasmine.SpyObj<AdminAppointmentService>;

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AdminAppointmentService', [
      'getDoctorList',
      'getDoctorAvailability',
      'bookAdminAppointment'
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminAppointmentBookingComponent],
      providers: [
        { provide: AdminAppointmentService, useValue: appointmentServiceSpy }
      ]
    }).compileComponents();

    appointmentService = TestBed.inject(AdminAppointmentService) as jasmine.SpyObj<AdminAppointmentService>;
    fixture = TestBed.createComponent(AdminAppointmentBookingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Doctor Selection', () => {
    it('should load doctors on init', () => {
      const mockDoctors = [
        {
          id: 'doc-1',
          name: 'Dr. Smith',
          specialty: 'Cardiology',
          avatar: 'avatar.jpg',
          photo: 'photo.jpg',
          rating: 4.5,
          consultationFee: 100,
          availability: [],
          clinicName: 'Heart Clinic',
          address: '123 Medical Center'
        }
      ];

      appointmentService.getDoctorList.and.returnValue(of(mockDoctors));

      component.ngOnInit();

      expect(appointmentService.getDoctorList).toHaveBeenCalled();
      expect(component.doctors()).toEqual(mockDoctors);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading doctors', () => {
      appointmentService.getDoctorList.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.ngOnInit();

      expect(component.error()).toContain('Failed to load doctors');
      expect(component.loading()).toBe(false);
    });

    it('should select doctor and load availability', () => {
      const mockDoctor = {
        id: 'doc-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        avatar: 'avatar.jpg',
        photo: 'photo.jpg',
        rating: 4.5,
        consultationFee: 100,
        availability: [],
        clinicName: 'Heart Clinic',
        address: '123 Medical Center'
      };

      const mockAvailability = {
        availability: [
          {
            date: '2024-01-20',
            day: 'Saturday',
            slots: [
              { id: 'slot-1', time: '10:00', available: true }
            ]
          }
        ]
      };

      appointmentService.getDoctorAvailability.and.returnValue(of(mockAvailability));

      component.onDoctorSelected(mockDoctor);

      expect(component.selectedDoctor()).toEqual(mockDoctor);
      expect(appointmentService.getDoctorAvailability).toHaveBeenCalledWith('doc-1');
      expect(component.availableSlots()).toEqual(mockAvailability.availability);
    });
  });

  describe('Date and Time Selection', () => {
    beforeEach(() => {
      component.availableSlots.set([
        {
          date: '2024-01-20',
          day: 'Saturday',
          slots: [
            { id: 'slot-1', time: '10:00', available: true },
            { id: 'slot-2', time: '11:00', available: true }
          ]
        },
        {
          date: '2024-01-21',
          day: 'Sunday',
          slots: [
            { id: 'slot-3', time: '14:00', available: true }
          ]
        }
      ]);
    });

    it('should get available dates from slots', () => {
      const dates = component.getAvailableDates();

      expect(dates).toContain('2024-01-20');
      expect(dates).toContain('2024-01-21');
      expect(dates.length).toBe(2);
    });

    it('should get available times for selected date', () => {
      const times = component.getAvailableTimesForDate('2024-01-20');

      expect(times.length).toBe(2);
      expect(times[0].time).toBe('10:00');
      expect(times[1].time).toBe('11:00');
    });

    it('should return empty array for date with no slots', () => {
      const times = component.getAvailableTimesForDate('2024-01-25');

      expect(times).toEqual([]);
    });

    it('should select date and clear time selection', () => {
      component.selectedTime.set('10:00');
      component.selectedSlotId.set('slot-1');

      component.onDateSelected('2024-01-20');

      expect(component.selectedDate()).toBe('2024-01-20');
      expect(component.selectedTime()).toBe('');
      expect(component.selectedSlotId()).toBe('');
    });

    it('should select time and slot', () => {
      component.onTimeSelected('10:00', 'slot-1');

      expect(component.selectedTime()).toBe('10:00');
      expect(component.selectedSlotId()).toBe('slot-1');
    });
  });

  describe('Appointment Booking', () => {
    beforeEach(() => {
      component.selectedDoctor.set({
        id: 'doc-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        avatar: 'avatar.jpg',
        photo: 'photo.jpg',
        rating: 4.5,
        consultationFee: 100,
        availability: [],
        clinicName: 'Heart Clinic',
        address: '123 Medical Center'
      });
      component.selectedDate.set('2024-01-20');
      component.selectedTime.set('10:00');
      component.selectedSlotId.set('slot-1');
      component.appointmentType.set('in-person');
    });

    it('should validate form before booking', () => {
      component.selectedDoctor.set(null);

      component.bookAppointment();

      expect(component.error()).toContain('Please select a doctor');
    });

    it('should book appointment successfully', () => {
      const mockAppointment = {
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

      appointmentService.bookAdminAppointment.and.returnValue(of(mockAppointment));

      component.bookAppointment();

      expect(appointmentService.bookAdminAppointment).toHaveBeenCalled();
      expect(component.bookedAppointment()).toEqual(mockAppointment);
      expect(component.showConfirmation()).toBe(true);
      expect(component.successMessage()).toContain('successfully');
    });

    it('should handle booking error', () => {
      const errorResponse = { error: { message: 'Time slot already booked' } };
      appointmentService.bookAdminAppointment.and.returnValue(
        throwError(() => errorResponse)
      );

      component.bookAppointment();

      expect(component.error()).toContain('Time slot already booked');
      expect(component.showConfirmation()).toBe(false);
    });

    it('should reset form after successful booking', () => {
      component.selectedDoctor.set({
        id: 'doc-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        avatar: 'avatar.jpg',
        photo: 'photo.jpg',
        rating: 4.5,
        consultationFee: 100,
        availability: [],
        clinicName: 'Heart Clinic',
        address: '123 Medical Center'
      });
      component.selectedDate.set('2024-01-20');
      component.selectedTime.set('10:00');
      component.appointmentType.set('video');
      component.reason.set('Checkup');

      component.resetForm();

      expect(component.selectedDoctor()).toBeNull();
      expect(component.selectedDate()).toBe('');
      expect(component.selectedTime()).toBe('');
      expect(component.appointmentType()).toBe('in-person');
      expect(component.reason()).toBe('');
    });
  });

  describe('Confirmation Screen', () => {
    it('should display confirmation with appointment details', () => {
      const mockAppointment = {
        id: 'apt-1',
        doctorId: 'doc-1',
        patientId: 'admin-1',
        doctorName: 'Dr. Smith',
        patientName: 'Admin User',
        date: '2024-01-20',
        time: '10:00',
        type: 'in-person',
        status: 'upcoming',
        fee: 100,
        address: '123 Medical Center'
      };

      component.bookedAppointment.set(mockAppointment);
      component.showConfirmation.set(true);

      expect(component.showConfirmation()).toBe(true);
      expect(component.bookedAppointment()?.doctorName).toBe('Dr. Smith');
      expect(component.bookedAppointment()?.date).toBe('2024-01-20');
      expect(component.bookedAppointment()?.time).toBe('10:00');
    });

    it('should close confirmation screen', () => {
      component.showConfirmation.set(true);
      component.bookedAppointment.set({
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
      });

      component.closeConfirmation();

      expect(component.showConfirmation()).toBe(false);
      expect(component.bookedAppointment()).toBeNull();
      expect(component.successMessage()).toBe('');
    });

    it('should add appointment to calendar', () => {
      const mockAppointment = {
        id: 'apt-1',
        doctorId: 'doc-1',
        patientId: 'admin-1',
        doctorName: 'Dr. Smith',
        patientName: 'Admin User',
        date: '2024-01-20',
        time: '10:00',
        type: 'in-person',
        status: 'upcoming',
        fee: 100,
        address: '123 Medical Center'
      };

      component.bookedAppointment.set(mockAppointment);

      spyOn(window, 'open');

      component.addToCalendar();

      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should validate form is complete', () => {
      component.selectedDoctor.set(null);
      component.selectedDate.set('');
      component.selectedTime.set('');

      expect(component.isFormValid()).toBe(false);

      component.selectedDoctor.set({
        id: 'doc-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        avatar: 'avatar.jpg',
        photo: 'photo.jpg',
        rating: 4.5,
        consultationFee: 100,
        availability: [],
        clinicName: 'Heart Clinic',
        address: '123 Medical Center'
      });
      component.selectedDate.set('2024-01-20');
      component.selectedTime.set('10:00');

      expect(component.isFormValid()).toBe(true);
    });
  });
});
