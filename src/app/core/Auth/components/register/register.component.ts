import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service.service';
import { CommonModule } from '@angular/common';
import { AuthNavbarComponent } from '../../../../shared/components/auth-navbar/auth-navbar.component';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, AuthNavbarComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2)]],
    email:          ['', [Validators.required, Validators.email]],
    phone:          ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)]],
    password:       ['', [Validators.required, Validators.minLength(6)]],
    role:           ['patient'],
    // Doctor fields
    specialty:      [''],
    experience:     [0],
    bio:            [''],
    education:      [''],
    languages:      [''],
    certificateUrl: [''],
  });

  error = '';
  isLoading = false;
  pendingApproval = signal(false);
  selectedIdFile: File | null = null;
  idFileName: string = '';

  get isDoctor() { return this.form.get('role')?.value === 'doctor'; }

  onIdFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'ID document must be less than 10MB';
        return;
      }
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.error = 'ID document must be an image (JPG, PNG) or PDF';
        return;
      }
      this.selectedIdFile = file;
      this.idFileName = file.name;
      this.error = '';
    }
  }

  submit(): void {
    this.error = '';
    
    // Validate doctor ID document
    if (this.isDoctor && !this.selectedIdFile) {
      this.error = 'Please upload your ID document';
      return;
    }
    
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }
    
    this.isLoading = true;

    const { name, email, phone, password, role, specialty, experience, bio, education, languages, certificateUrl } = this.form.value;
    
    // Parse education and languages from comma-separated strings to arrays
    const educationArray = education ? education.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [];
    const languagesArray = languages ? languages.split(',').map((l: string) => l.trim()).filter((l: string) => l) : [];
    
    // Register user first
    this.auth.register(name!, email!, password!, role, phone!, { 
      specialty, 
      experience: experience || 0,
      bio,
      education: educationArray,
      languages: languagesArray,
      certificateUrl 
    }).pipe(
      switchMap((response) => {
        // If doctor and has ID file, upload it
        if (role === 'doctor' && this.selectedIdFile) {
          return this.auth.uploadIdDocument(this.selectedIdFile!);
        }
        return [response];
      })
    ).subscribe({
      next: () => {
        if (role === 'doctor') {
          this.pendingApproval.set(true);
          this.isLoading = false;
        } else {
          this.auth.redirectByRole();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }
}
