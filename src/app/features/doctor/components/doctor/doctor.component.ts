import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './doctor.component.html',
  styleUrl: './doctor.component.css'
})
export class DoctorComponent {
  isSidebarOpen = false;
  constructor(public auth: AuthService) {}
  signOut() { this.auth.logout(); }
}
