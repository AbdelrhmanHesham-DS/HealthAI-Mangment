import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { Appointment } from '../../models/health.models';
import { ApCountPipe } from '../../pipes/ap-count.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HealthNavbarComponent, ApCountPipe],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.css'
})
export class AppointmentsPageComponent implements OnInit {
  activeTab = signal<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  activeCall = signal<{ apt: Appointment; url: SafeResourceUrl } | null>(null);
  reviewModalApt = signal<Appointment | null>(null);
  reviewRating = signal(5);
  reviewComment = '';
  hoverRating = signal(0);
  isSubmittingReview = signal(false);

  constructor(public dataService: HealthDataService, private sanitizer: DomSanitizer) {}

  ngOnInit() { this.dataService.getAppointments().subscribe(); }

  filtered = computed(() =>
    this.dataService.appointments().filter(a => a.status === this.activeTab())
  );

  typeIcon(type: string) {
    return type === 'video' ? 'fa-video' : type === 'chat' ? 'fa-comment-medical' : 'fa-hospital';
  }
  typeColor(type: string) {
    return type === 'video' ? '#6366f1' : type === 'chat' ? '#10b981' : '#f59e0b';
  }

  cancel(id: string) {
    this.dataService.cancelAppointment(id).subscribe();
  }

  joinCall(apt: Appointment) {
    // Generate a unique, deterministic room name from appointment id
    const roomName = `healthai-${apt.id}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(jitsiUrl);
    this.activeCall.set({ apt, url: safeUrl });
  }

  endCall() {
    this.activeCall.set(null);
  }

  openReviewModal(apt: Appointment) {
    this.reviewModalApt.set(apt);
    this.reviewRating.set(5);
    this.reviewComment = '';
    this.hoverRating.set(0);
  }

  closeReviewModal() {
    this.reviewModalApt.set(null);
    this.reviewComment = '';
    this.reviewRating.set(5);
  }

  submitReview() {
    const apt = this.reviewModalApt();
    if (!apt || !this.reviewComment.trim()) return;

    this.isSubmittingReview.set(true);

    const review = {
      doctorId: this.getDoctorId(apt),
      rating: this.reviewRating(),
      comment: this.reviewComment,
      visitType: apt.type,
    };

    this.dataService.addReview(review).subscribe({
      next: () => {
        // Mark appointment as reviewed
        this.dataService.markAppointmentReviewed(apt.id).subscribe();
        this.isSubmittingReview.set(false);
        this.closeReviewModal();
        // Refresh appointments to show reviewed status
        this.dataService.getAppointments().subscribe();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        alert('Failed to submit review. Please try again.');
        this.isSubmittingReview.set(false);
      }
    });
  }

  getDoctorId(apt: Appointment): string {
    if (typeof apt.doctorId === 'string') return apt.doctorId;
    return apt.doctorId._id || apt.doctorId.id || '';
  }
}
