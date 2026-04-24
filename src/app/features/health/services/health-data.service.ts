import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Doctor, Appointment, MedicalRecord, AdminStats,
  Notification, Review, SearchFilters
} from '../models/health.models';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class HealthDataService {
  private http = inject(HttpClient);

  notifications = signal<Notification[]>([]);
  appointments  = signal<Appointment[]>([]);

  // ── Doctors ──────────────────────────────────────────────────────────────

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${API}/doctors`);
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${API}/doctors/${id}`);
  }

  searchDoctors(filters: Partial<SearchFilters>): Observable<Doctor[]> {
    let params = new HttpParams();
    if (filters.query)         params = params.set('query', filters.query);
    if (filters.specialty)     params = params.set('specialty', filters.specialty);
    if (filters.city)          params = params.set('city', filters.city);
    if (filters.visitType)     params = params.set('visitType', filters.visitType);
    if (filters.minRating)     params = params.set('minRating', String(filters.minRating));
    if (filters.maxFee)        params = params.set('maxFee', String(filters.maxFee));
    if (filters.availableToday) params = params.set('availableToday', 'true');
    return this.http.get<Doctor[]>(`${API}/doctors`, { params });
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/doctors/cities`);
  }

  getSymptomSuggestion(symptoms: string): Observable<{ specialtyKey: string; doctors: Doctor[] }> {
    return this.http.get<{ specialtyKey: string; doctors: Doctor[] }>(
      `${API}/doctors/symptom-check`, { params: { symptoms } }
    );
  }

  // ── Reviews ──────────────────────────────────────────────────────────────

  getReviewsByDoctor(doctorId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${API}/reviews`, { params: { doctorId } });
  }

  addReview(review: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${API}/reviews`, review);
  }

  // ── Appointments ─────────────────────────────────────────────────────────

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${API}/appointments`).pipe(
      tap(apts => this.appointments.set(apts))
    );
  }

  addAppointment(apt: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${API}/appointments`, apt).pipe(
      tap(newApt => this.appointments.update(list => [newApt, ...list]))
    );
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${API}/appointments/${id}/cancel`, {}).pipe(
      tap(() => this.appointments.update(list =>
        list.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
      ))
    );
  }

  markAppointmentReviewed(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${API}/appointments/${id}/reviewed`, {}).pipe(
      tap(() => this.appointments.update(list =>
        list.map(a => a.id === id ? { ...a, reviewed: true } : a)
      ))
    );
  }

  // ── Medical Records ───────────────────────────────────────────────────────

  getMedicalRecords(): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${API}/records`);
  }

  addMedicalRecord(record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${API}/records`, record);
  }

  deleteMedicalRecord(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/records/${id}`);
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${API}/notifications`).pipe(
      tap(n => this.notifications.set(n))
    );
  }

  markNotificationRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${API}/notifications/${id}/read`, {}).pipe(
      tap(() => this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, read: true } : n)
      ))
    );
  }

  markAllNotificationsRead(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API}/notifications/read-all`, {}).pipe(
      tap(() => this.notifications.update(list => list.map(n => ({ ...n, read: true }))))
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API}/admin/stats`);
  }

  getAdminUsers(role?: string, filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.specialty) params = params.set('specialty', filters.specialty);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.minRating) params = params.set('minRating', filters.minRating);
    if (filters?.maxRating) params = params.set('maxRating', filters.maxRating);
    return this.http.get<any[]>(`${API}/admin/users`, { params });
  }

  getAdminUserById(id: string): Observable<any> {
    return this.http.get<any>(`${API}/admin/users/${id}`);
  }

  updateAdminUser(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${API}/admin/users/${id}`, data);
  }

  getPendingDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/admin/pending-doctors`);
  }

  approveDoctor(id: string): Observable<any> {
    return this.http.put(`${API}/admin/users/${id}/approve`, {});
  }

  rejectDoctor(id: string): Observable<any> {
    return this.http.put(`${API}/admin/users/${id}/reject`, {});
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${API}/admin/users/${id}`);
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${API}/admin/appointments`);
  }

  createAppointment(appointmentData: any): Observable<Appointment> {
    return this.http.post<Appointment>(`${API}/admin/appointments`, appointmentData);
  }

  updateAppointment(id: string, appointmentData: any): Observable<Appointment> {
    return this.http.put<Appointment>(`${API}/admin/appointments/${id}`, appointmentData);
  }

  updateAppointmentStatus(id: string, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${API}/admin/appointments/${id}/status`, { status });
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete(`${API}/admin/appointments/${id}`);
  }

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${API}/admin/reviews`);
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${API}/admin/reviews/${id}`);
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${API}/admin/dashboard-summary`);
  }

  // Analytics
  getRevenueAnalytics(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${API}/admin/analytics/revenue`, { params: { period } });
  }

  getAppointmentAnalytics(): Observable<any> {
    return this.http.get<any>(`${API}/admin/analytics/appointments`);
  }

  getDoctorAnalytics(): Observable<any> {
    return this.http.get<any>(`${API}/admin/analytics/doctors`);
  }

  getPatientAnalytics(): Observable<any> {
    return this.http.get<any>(`${API}/admin/analytics/patients`);
  }

  // Bulk Operations
  bulkApproveDoctors(ids: string[]): Observable<any> {
    return this.http.post(`${API}/admin/bulk/approve-doctors`, { ids });
  }

  bulkRejectDoctors(ids: string[]): Observable<any> {
    return this.http.post(`${API}/admin/bulk/reject-doctors`, { ids });
  }

  bulkDeleteUsers(ids: string[]): Observable<any> {
    return this.http.post(`${API}/admin/bulk/delete-users`, { ids });
  }

  // Notifications
  sendNotification(userIds: string[], title: string, message: string, type: string = 'system'): Observable<any> {
    return this.http.post(`${API}/admin/notifications/send`, { userIds, title, message, type });
  }

  broadcastNotification(title: string, message: string, role?: string, type: string = 'system'): Observable<any> {
    return this.http.post(`${API}/admin/notifications/broadcast`, { title, message, role, type });
  }

  // Activity Logs
  getActivityLogs(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.skip) params = params.set('skip', filters.skip);
    if (filters?.action) params = params.set('action', filters.action);
    if (filters?.userId) params = params.set('userId', filters.userId);
    return this.http.get<any>(`${API}/admin/activity-logs`, { params });
  }

  createActivityLog(action: string, details: string, userId?: string, targetType?: string, targetId?: string): Observable<any> {
    return this.http.post(`${API}/admin/activity-logs`, { action, details, userId, targetType, targetId });
  }

  // Export
  exportUsers(role?: string): string {
    const params = role ? `?role=${role}` : '';
    return `${API}/admin/export/users${params}`;
  }

  exportAppointments(): string {
    return `${API}/admin/export/appointments`;
  }

  // ── Health Metrics ────────────────────────────────────────────────────────

  getMetrics(type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<any[]>(`${API}/metrics`, { params });
  }

  addMetric(metric: any): Observable<any> {
    return this.http.post<any>(`${API}/metrics`, metric);
  }

  deleteMetric(id: string): Observable<any> {
    return this.http.delete(`${API}/metrics/${id}`);
  }

  getMetricsSummary(): Observable<any> {
    return this.http.get<any>(`${API}/metrics/summary`);
  }

  // ── Symptom Cases ─────────────────────────────────────────────────────────

  getCases(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/cases`);
  }

  saveCase(data: { title: string; answers: any; result: any; mode: string }): Observable<any> {
    return this.http.post<any>(`${API}/cases`, data);
  }

  deleteCase(id: string): Observable<any> {
    return this.http.delete(`${API}/cases/${id}`);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // ── Doctor Dashboard ─────────────────────────────────────────────────────

  getDoctorAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/doctor/appointments`);
  }

  getDoctorPatients(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/doctor/patients`);
  }

  getDoctorReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/doctor/reviews`);
  }

  getDoctorSchedule(): Observable<any> {
    return this.http.get<any>(`${API}/doctor/schedule`);
  }

  updateDoctorSchedule(schedule: any): Observable<any> {
    return this.http.put<any>(`${API}/doctor/schedule`, schedule);
  }

  createPrescription(prescription: any): Observable<any> {
    return this.http.post<any>(`${API}/doctor/prescriptions`, prescription);
  }

  getPrescriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/doctor/prescriptions`);
  }

  exportDoctorAppointments(): string {
    return `${API}/doctor/export/appointments`;
  }

  exportDoctorEarnings(): string {
    return `${API}/doctor/export/earnings`;
  }
}
