import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './core/Auth/components/login/login.component';
import { RegisterComponent } from './core/Auth/components/register/register.component';

export const routes: Routes = [
  // Root
  { path: '', redirectTo: 'health', pathMatch: 'full' },

  // Auth
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Main Health Platform
  {
    path: 'health',
    loadChildren: () => import('./features/health/health.routes').then(m => m.HEALTH_ROUTES),
  },

  // AI Chatbot Assistant
  {
    path: 'chatbot',
    loadChildren: () => import('./features/chatbot/chatbot.routes').then(m => m.CHATBOT_ROUTES),
  },

  // Doctor Dashboard (protected)
  {
    path: 'doctor',
    canActivate: [authGuard],
    data: { role: 'doctor' },
    loadComponent: () => import('./features/doctor/components/doctor/doctor.component').then(m => m.DoctorComponent),
    children: [
      { path: '', redirectTo: 'Appointments', pathMatch: 'full' },
      { path: 'Appointments',    loadComponent: () => import('./features/doctor/components/doc-myappointment/doc-myappointment.component').then(m => m.DocMyappointmentComponent) },
      { path: 'Medical-Records', loadComponent: () => import('./features/doctor/components/doctor-medical-records/doctor-medical-records.component').then(m => m.DoctorMedicalRecordsComponent) },
      { path: 'Patients',        loadComponent: () => import('./features/doctor/components/doc-patient/doc-patient.component').then(m => m.DocPatientComponent) },
      { path: 'My-Profile',      loadComponent: () => import('./features/doctor/components/doc-profile/doc-profile.component').then(m => m.DocProfileComponent) },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'health' },
];
