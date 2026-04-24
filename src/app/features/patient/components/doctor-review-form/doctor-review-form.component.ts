import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientDoctorService } from '../../services/patient-doctor.service';

@Component({
  selector: 'app-doctor-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-review-form.component.html',
  styleUrls: ['./doctor-review-form.component.css']
})
export class DoctorReviewFormComponent implements OnInit {
  private doctorService = inject(PatientDoctorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  doctorId: string | null = null;
  doctorName = '';
  rating = 5;
  comment = '';
  loading = false;
  error = '';
  success = false;

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('doctorId');
    const doctorName = this.route.snapshot.queryParamMap.get('doctorName');
    if (doctorName) {
      this.doctorName = doctorName;
    }
  }

  submitReview(): void {
    if (!this.doctorId) {
      this.error = 'Doctor ID is missing';
      return;
    }

    if (!this.comment.trim()) {
      this.error = 'Please enter a review comment';
      return;
    }

    this.loading = true;
    this.error = '';

    const reviewData = {
      doctorId: this.doctorId,
      rating: this.rating,
      comment: this.comment.trim()
    };

    this.doctorService.submitReview(reviewData).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/patient/my-appointments']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to submit review. Please try again.';
        this.loading = false;
      }
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  getRatingStars(): number[] {
    return Array(5).fill(0);
  }

  goBack(): void {
    this.router.navigate(['/patient/my-appointments']);
  }
}
