import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  error = '';
  isLoading = false;

  submit(): void {
    this.error = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) this.router.navigateByUrl(returnUrl);
        else this.auth.redirectByRole();
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password.';
        this.isLoading = false;
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  fillDemo(role: 'patient' | 'doctor' | 'admin'): void {
    const creds: Record<string, { email: string; password: string }> = {
      patient: { email: 'patient@healthai.com', password: 'patient123' },
      doctor:  { email: 'doctor@healthai.com',  password: 'doctor123'  },
      admin:   { email: 'admin@healthai.com',   password: 'admin123'   },
    };
    this.form.patchValue(creds[role]);
  }
}
