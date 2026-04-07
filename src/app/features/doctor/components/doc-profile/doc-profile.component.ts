import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-doc-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doc-profile.component.html',
  styleUrl: './doc-profile.component.css'
})
export class DocProfileComponent implements OnInit {
  private auth = inject(AuthService);
  public theme = inject(ThemeService);

  isEditing = false;
  isSaving = false;
  saved = false;
  uploadingAvatar = false;

  doctor: any = {};
  editedDoctor: any = {};
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.auth.getMe().subscribe(user => {
      this.doctor = { ...user };
      this.editedDoctor = { ...user };
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.editedDoctor = { ...this.doctor };
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar() {
    if (!this.selectedAvatarFile) return;
    
    this.uploadingAvatar = true;
    this.auth.uploadAvatar(this.selectedAvatarFile).subscribe({
      next: (response) => {
        this.doctor.avatar = response.avatar;
        this.editedDoctor.avatar = response.avatar;
        this.uploadingAvatar = false;
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
        this.loadProfile();
      },
      error: () => {
        this.uploadingAvatar = false;
      }
    });
  }

  saveChanges() {
    this.isSaving = true;
    // Only allow updating phone number
    this.auth.updateMe({
      phone: this.editedDoctor.phone,
    }).subscribe({
      next: (response) => {
        this.doctor = { ...(response.user || response) };
        this.isEditing = false;
        this.isSaving = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => this.isSaving = false,
    });
  }
}
