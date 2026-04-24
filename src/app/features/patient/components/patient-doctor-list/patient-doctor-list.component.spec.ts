import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PatientDoctorListComponent } from './patient-doctor-list.component';
import { PatientDoctorService } from '../../services/patient-doctor.service';
import { of, throwError } from 'rxjs';

describe('PatientDoctorListComponent', () => {
  let component: PatientDoctorListComponent;
  let fixture: ComponentFixture<PatientDoctorListComponent>;
  let doctorService: PatientDoctorService;

  const mockDoctors = [
    {
      id: '1',
      name: 'Dr. Smith',
      specialty: 'Cardiology',
      specialtyKey: 'cardiology',
      avatar: 'avatar1.jpg',
      photo: 'photo1.jpg',
      rating: 4.5,
      reviewCount: 120,
      experience: 10,
      city: 'New York',
      location: 'Manhattan',
      address: '123 Main St',
      languages: ['English', 'Spanish'],
      bio: 'Experienced cardiologist',
      consultationFee: 100,
      nextAvailable: 'Today',
      verified: true,
      online: true,
      waitTime: '15 mins',
      insurances: ['Blue Cross'],
      education: ['MD from Harvard'],
      clinicName: 'Heart Clinic',
      availability: []
    },
    {
      id: '2',
      name: 'Dr. Jones',
      specialty: 'Neurology',
      specialtyKey: 'neurology',
      avatar: 'avatar2.jpg',
      photo: 'photo2.jpg',
      rating: 4.8,
      reviewCount: 95,
      experience: 8,
      city: 'Boston',
      location: 'Downtown',
      address: '456 Oak Ave',
      languages: ['English'],
      bio: 'Specialist in neurological disorders',
      consultationFee: 120,
      nextAvailable: 'Tomorrow',
      verified: true,
      online: false,
      waitTime: '20 mins',
      insurances: ['Aetna'],
      education: ['MD from Johns Hopkins'],
      clinicName: 'Brain Center',
      availability: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDoctorListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [PatientDoctorService]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDoctorListComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(PatientDoctorService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load doctors on init', () => {
      spyOn(doctorService, 'getDoctorList').and.returnValue(of(mockDoctors));

      component.ngOnInit();

      expect(doctorService.getDoctorList).toHaveBeenCalled();
      expect(component.doctors.length).toBe(2);
      expect(component.filteredDoctors.length).toBe(2);
    });

    it('should handle error when loading doctors', () => {
      spyOn(doctorService, 'getDoctorList').and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.ngOnInit();

      expect(component.error).toBeTruthy();
      expect(component.loading).toBe(false);
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      component.doctors = mockDoctors;
    });

    it('should filter by search query', () => {
      component.searchQuery = 'Smith';
      component.applyFilters();

      expect(component.filteredDoctors.length).toBe(1);
      expect(component.filteredDoctors[0].name).toBe('Dr. Smith');
    });

    it('should filter by specialty', () => {
      component.selectedSpecialty = 'Neurology';
      component.applyFilters();

      expect(component.filteredDoctors.length).toBe(1);
      expect(component.filteredDoctors[0].specialty).toBe('Neurology');
    });

    it('should filter by minimum rating', () => {
      component.minRating = 4.7;
      component.applyFilters();

      expect(component.filteredDoctors.length).toBe(1);
      expect(component.filteredDoctors[0].rating).toBe(4.8);
    });

    it('should apply multiple filters', () => {
      component.searchQuery = 'Dr';
      component.selectedSpecialty = 'Cardiology';
      component.minRating = 4.5;
      component.applyFilters();

      expect(component.filteredDoctors.length).toBe(1);
      expect(component.filteredDoctors[0].name).toBe('Dr. Smith');
    });

    it('should return all doctors when no filters applied', () => {
      component.searchQuery = '';
      component.selectedSpecialty = '';
      component.minRating = 0;
      component.applyFilters();

      expect(component.filteredDoctors.length).toBe(2);
    });
  });

  describe('getRatingStars', () => {
    it('should return correct number of stars', () => {
      expect(component.getRatingStars(4.5).length).toBe(4);
      expect(component.getRatingStars(5).length).toBe(5);
      expect(component.getRatingStars(3.2).length).toBe(3);
    });
  });

  describe('viewDoctorProfile', () => {
    it('should navigate to doctor profile', () => {
      spyOn(component['router'], 'navigate');

      component.viewDoctorProfile('1');

      expect(component['router'].navigate).toHaveBeenCalledWith(['/patient/doctor-profile', '1']);
    });
  });
});
