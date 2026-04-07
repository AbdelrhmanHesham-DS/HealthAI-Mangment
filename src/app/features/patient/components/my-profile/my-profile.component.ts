import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  private auth = inject(AuthService);

  isEditing = false;
  isSaving = false;
  saved = false;
  uploadingAvatar = false;

  patient: any = {};
  edited: any = {};
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.auth.getMe().subscribe(user => {
      this.patient = { ...user };
      this.edited = { ...user };
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.edited = { ...this.patient };
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar() {
    if (!this.selectedFile) return;
    
    this.uploadingAvatar = true;
    this.auth.uploadAvatar(this.selectedFile).subscribe({
      next: (response) => {
        this.patient.avatar = response.avatar;
        this.edited.avatar = response.avatar;
        this.uploadingAvatar = false;
        this.selectedFile = null;
        this.previewUrl = null;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
        this.loadProfile();
      },
      error: () => {
        this.uploadingAvatar = false;
      }
    });
  }

  save() {
    this.isSaving = true;
    this.auth.updateMe({
      name:        this.edited.name,
      phone:       this.edited.phone,
      gender:      this.edited.gender,
      address:     this.edited.address,
      dateOfBirth: this.edited.dateOfBirth,
    }).subscribe({
      next: (response) => {
        this.patient = { ...(response.user || response) };
        this.isEditing = false;
        this.isSaving = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => this.isSaving = false,
    });
  }
}
