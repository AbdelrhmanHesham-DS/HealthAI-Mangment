import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { Doctor, Review } from '../../models/health.models';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HealthNavbarComponent],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  doctor = signal<Doctor | null>(null);
  reviews = signal<Review[]>([]);
  activeTab = signal<'about' | 'reviews' | 'availability'>('about');
  showReviewForm = signal(false);
  newRating = signal(5);
  newComment = signal('');
  hoverRating = signal(0);
  isLoading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private dataService: HealthDataService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || 'd1';
    this.dataService.getDoctorById(id).subscribe(doc => {
      this.doctor.set(doc || null);
      this.isLoading.set(false);
    });
    this.dataService.getReviewsByDoctor(id).subscribe(r => this.reviews.set(r));
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.floor(r) ? 1 : 0); }

  ratingBreakdown() {
    const revs = this.reviews();
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: revs.filter(r => Math.floor(r.rating) === star).length,
      pct: revs.length ? (revs.filter(r => Math.floor(r.rating) === star).length / revs.length) * 100 : 0
    }));
  }

  submitReview() {
    if (!this.newComment().trim() || !this.doctor()) return;
    
    const review = {
      doctorId: this.doctor()!.id,
      rating: this.newRating(),
      comment: this.newComment(),
      visitType: 'in-person',
    };
    
    this.dataService.addReview(review).subscribe({
      next: (saved) => {
        this.reviews.update(r => [saved, ...r]);
        this.showReviewForm.set(false);
        this.newComment.set('');
        this.newRating.set(5);
        
        // Refresh doctor data to get updated rating
        const id = this.route.snapshot.paramMap.get('id') || '';
        this.dataService.getDoctorById(id).subscribe(doc => {
          this.doctor.set(doc || null);
        });
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        alert('Failed to submit review. Please try again.');
      }
    });
  }
}
