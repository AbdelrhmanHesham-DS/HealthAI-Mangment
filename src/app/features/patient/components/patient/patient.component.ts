import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './patient.component.html',
  styleUrl: './patient.component.css'
})
export class PatientComponent {
  constructor(public auth: AuthService) {}

  toggleMenu(): void {
    const menu = document.querySelector('.menu');
    if (menu) menu.classList.toggle('visible');
  }

  signOut(): void { this.auth.logout(); }
}
