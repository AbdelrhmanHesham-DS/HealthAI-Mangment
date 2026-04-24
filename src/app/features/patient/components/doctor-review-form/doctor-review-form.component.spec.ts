import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { DoctorReviewFormComponent } from './doctor-review-form.component';
import { PatientDoctorService } from '../../services/patient-doctor.service';
import { of, throwError } from 'rxjs';

describe('DoctorReviewFormComponent', () => {
  let component: DoctorReviewFormComponent;
  let fixture: ComponentFixture<DoctorReviewFormComponent>;
  let doctorService: PatientDoctorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorReviewFormComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        PatientDoctorService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'doctorId' ? '1' : null
              },
              queryParamMap: {
                get: (key: string) => key === 'doctorName' ? 'Smith' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorReviewFormComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(PatientDoctorService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with doctor ID and name from route', () => {
      component.ngOnInit();

      expect(component.doctorId).toBe('1');
      expect(component.doctorName).toBe('Smith');
    });
  });

  describe('setRating', () => {
    it('should set rating value', () => {
      component.setRating(4);

      expect(component.rating).toBe(4);
    });
  });

  describe('getRatingStars', () => {
    it('should return array of 5 stars', () => {
      const stars = component.getRatingStars();

      expect(stars.length).toBe(5);
    });
  });

  describe('submitReview', () => {
    beforeEach(() => {
      component.doctorId = '1';
    });

    it('should submit review successfully', (done) => {
      spyOn(doctorService, 'submitReview').and.returnValue(of({ id: '1' }));
      spyOn(component['router'], 'navigate');

      component.rating = 5;
      component.comment = 'Great doctor!';

      component.submitReview();

      expect(doctorService.submitReview).toHaveBeenCalledWith({
        doctorId: '1',
        rating: 5,
        comment: 'Great doctor!'
      });
      expect(component.success).toBe(true);
      expect(component.loading).toBe(false);

      setTimeout(() => {
        expect(component['router'].navigate).toHaveBeenCalledWith(['/patient/my-appointments']);
        done();
      }, 2100);
    });

    it('should show error if comment is empty', () => {
      component.comment = '';

      component.submitReview();

      expect(component.error).toBe('Please enter a review comment');
    });

    it('should show error if comment is only whitespace', () => {
      component.comment = '   ';

      component.submitReview();

      expect(component.error).toBe('Please enter a review comment');
    });

    it('should show error if doctor ID is missing', () => {
      component.doctorId = null;
      component.comment = 'Great doctor!';

      component.submitReview();

      expect(component.error).toBe('Doctor ID is missing');
    });

    it('should handle submission error', () => {
      spyOn(doctorService, 'submitReview').and.returnValue(
        throwError(() => ({ error: { message: 'Failed to submit' } }))
      );

      component.rating = 5;
      component.comment = 'Great doctor!';

      component.submitReview();

      expect(component.error).toBe('Failed to submit');
      expect(component.loading).toBe(false);
    });

    it('should handle error without message', () => {
      spyOn(doctorService, 'submitReview').and.returnValue(
        throwError(() => ({}))
      );

      component.rating = 5;
      component.comment = 'Great doctor!';

      component.submitReview();

      expect(component.error).toBe('Failed to submit review. Please try again.');
    });
  });

  describe('goBack', () => {
    it('should navigate back to appointments', () => {
      spyOn(component['router'], 'navigate');

      component.goBack();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/patient/my-appointments']);
    });
  });
});
