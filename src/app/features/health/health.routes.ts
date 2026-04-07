import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const HEALTH_ROUTES: Routes = [
  // ── Public ──────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/health-home/health-home.component').then(m => m.HealthHomeComponent),
  },
  {
    path: 'doctors',
    loadComponent: () => import('./pages/doctor-list/doctor-list.component').then(m => m.DoctorListComponent),
  },
  {
    path: 'doctor/:id',
    loadComponent: () => import('./pages/doctor-profile/doctor-profile.component').then(m => m.DoctorProfileComponent),
  },
  {
    path: 'symptom-checker',
    loadComponent: () => import('./pages/symptom-checker/symptom-checker.component').then(m => m.SymptomCheckerComponent),
  },

  // ── Protected — any authenticated user ──────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
  },
  {
    path: 'book/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking-page/booking-page.component').then(m => m.BookingPageComponent),
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/appointments-page/appointments-page.component').then(m => m.AppointmentsPageComponent),
  },
  {
    path: 'records',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/medical-records-page/medical-records-page.component').then(m => m.MedicalRecordsPageComponent),
  },
  {
    path: 'health-tracker',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/health-tracker/health-tracker.component').then(m => m.HealthTrackerComponent),
  },
  {
    path: 'hospitals',
    loadComponent: () => import('./pages/nearby-hospitals/nearby-hospitals.component').then(m => m.NearbyHospitalsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
  },

  // ── Admin only ───────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    loadComponent: () => import('./pages/health-admin/health-admin.component').then(m => m.HealthAdminComponent),
  },
];
