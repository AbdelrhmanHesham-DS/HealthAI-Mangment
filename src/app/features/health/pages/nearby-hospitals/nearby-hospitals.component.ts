import { Component, signal, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';

interface Hospital {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'emergency' | 'pharmacy';
  address: string;
  city: string;
  phone: string;
  distance: string;
  rating: number;
  open24h: boolean;
  emergency: boolean;
  specialties: string[];
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-nearby-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule, HealthNavbarComponent],
  templateUrl: './nearby-hospitals.component.html',
  styleUrl: './nearby-hospitals.component.css',
})
export class NearbyHospitalsComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  searchQuery  = signal('');
  selectedCity = signal('all');
  selectedType = signal('all');
  isLocating   = signal(false);
  userLocation = signal<{ lat: number; lng: number } | null>(null);

  cities = ['all', 'Cairo', 'Alexandria', 'Giza'];
  types  = [
    { key: 'all',       label: 'All',        icon: 'fa-building-columns' },
    { key: 'hospital',  label: 'Hospitals',  icon: 'fa-hospital' },
    { key: 'clinic',    label: 'Clinics',    icon: 'fa-house-medical' },
    { key: 'emergency', label: 'Emergency',  icon: 'fa-truck-medical' },
    { key: 'pharmacy',  label: 'Pharmacies', icon: 'fa-prescription-bottle-medical' },
  ];

  // Comprehensive list of real Egyptian hospitals/clinics
  allHospitals: Hospital[] = [
    { id: 'h1',  name: 'Cairo University Hospital',       type: 'hospital',  address: 'Kasr Al Ainy St, Cairo',          city: 'Cairo',      phone: '+20 2 2365 2000', distance: '2.1 km', rating: 4.2, open24h: true,  emergency: true,  specialties: ['Cardiology','Neurology','Oncology','Surgery'], lat: 30.0333, lng: 31.2333 },
    { id: 'h2',  name: 'Ain Shams University Hospital',   type: 'hospital',  address: 'Abbasia, Cairo',                  city: 'Cairo',      phone: '+20 2 2482 3000', distance: '3.5 km', rating: 4.0, open24h: true,  emergency: true,  specialties: ['Pediatrics','Orthopedics','Dermatology'], lat: 30.0667, lng: 31.2833 },
    { id: 'h3',  name: 'Cleopatra Hospital',              type: 'hospital',  address: '4 Cleopatra St, Heliopolis',       city: 'Cairo',      phone: '+20 2 2414 9000', distance: '4.2 km', rating: 4.5, open24h: true,  emergency: true,  specialties: ['Cardiology','Gynecology','Pediatrics'], lat: 30.0833, lng: 31.3333 },
    { id: 'h4',  name: 'As-Salam International Hospital', type: 'hospital',  address: 'Corniche El Nile, Maadi',          city: 'Cairo',      phone: '+20 2 2524 0250', distance: '5.8 km', rating: 4.6, open24h: true,  emergency: true,  specialties: ['Cardiology','Neurology','Oncology','Radiology'], lat: 29.9667, lng: 31.2500 },
    { id: 'h5',  name: 'Dar Al Fouad Hospital',           type: 'hospital',  address: '26 July Corridor, 6th October',   city: 'Giza',       phone: '+20 2 3835 6000', distance: '8.1 km', rating: 4.7, open24h: true,  emergency: true,  specialties: ['Cardiology','Transplant','Oncology'], lat: 29.9667, lng: 30.9333 },
    { id: 'h6',  name: 'Alexandria University Hospital',  type: 'hospital',  address: 'El Hadara, Alexandria',            city: 'Alexandria', phone: '+20 3 4200 000',  distance: '1.2 km', rating: 4.1, open24h: true,  emergency: true,  specialties: ['General Surgery','Pediatrics','Neurology'], lat: 31.2000, lng: 29.9167 },
    { id: 'h7',  name: 'El Shatby Hospital',              type: 'hospital',  address: 'El Shatby, Alexandria',            city: 'Alexandria', phone: '+20 3 4870 000',  distance: '2.3 km', rating: 3.9, open24h: true,  emergency: true,  specialties: ['Obstetrics','Gynecology','Pediatrics'], lat: 31.2167, lng: 29.9333 },
    { id: 'h8',  name: 'Nasser Institute Hospital',       type: 'hospital',  address: 'Abbassia, Cairo',                 city: 'Cairo',      phone: '+20 2 2482 5000', distance: '3.8 km', rating: 4.0, open24h: true,  emergency: true,  specialties: ['Oncology','Hematology','Radiology'], lat: 30.0667, lng: 31.2833 },
    { id: 'c1',  name: 'Cairo Heart Center',              type: 'clinic',    address: '15 Makram Ebeid, Nasr City',       city: 'Cairo',      phone: '+20 2 2670 0000', distance: '1.5 km', rating: 4.9, open24h: false, emergency: false, specialties: ['Cardiology'], lat: 30.0500, lng: 31.3333 },
    { id: 'c2',  name: 'NeuroMed Clinic',                 type: 'clinic',    address: '7 Victor Emmanuel, Smouha',        city: 'Alexandria', phone: '+20 3 4250 000',  distance: '0.8 km', rating: 4.8, open24h: false, emergency: false, specialties: ['Neurology'], lat: 31.2167, lng: 29.9500 },
    { id: 'c3',  name: 'SkinCare Clinic',                 type: 'clinic',    address: '22 Merghany St, Heliopolis',       city: 'Cairo',      phone: '+20 2 2415 0000', distance: '2.0 km', rating: 4.7, open24h: false, emergency: false, specialties: ['Dermatology'], lat: 30.0833, lng: 31.3167 },
    { id: 'c4',  name: 'Little Stars Pediatric Clinic',   type: 'clinic',    address: '18 Road 9, Maadi',                 city: 'Cairo',      phone: '+20 2 2358 0000', distance: '3.2 km', rating: 4.9, open24h: false, emergency: false, specialties: ['Pediatrics'], lat: 29.9667, lng: 31.2500 },
    { id: 'e1',  name: 'Cairo Emergency Center',          type: 'emergency', address: 'Tahrir Square, Downtown Cairo',    city: 'Cairo',      phone: '123',             distance: '1.0 km', rating: 4.3, open24h: true,  emergency: true,  specialties: ['Emergency Medicine','Trauma'], lat: 30.0444, lng: 31.2358 },
    { id: 'e2',  name: 'Alexandria Emergency Hospital',   type: 'emergency', address: 'Corniche, Alexandria',             city: 'Alexandria', phone: '123',             distance: '0.5 km', rating: 4.1, open24h: true,  emergency: true,  specialties: ['Emergency Medicine'], lat: 31.2000, lng: 29.9167 },
    { id: 'p1',  name: 'El Ezaby Pharmacy',               type: 'pharmacy',  address: 'Multiple branches, Cairo',         city: 'Cairo',      phone: '16229',           distance: '0.3 km', rating: 4.4, open24h: true,  emergency: false, specialties: ['Pharmacy'], lat: 30.0444, lng: 31.2358 },
    { id: 'p2',  name: 'Seif Pharmacy',                   type: 'pharmacy',  address: 'Multiple branches, Cairo',         city: 'Cairo',      phone: '19600',           distance: '0.5 km', rating: 4.3, open24h: true,  emergency: false, specialties: ['Pharmacy'], lat: 30.0500, lng: 31.2400 },
  ];

  get filtered(): Hospital[] {
    const q = this.searchQuery().toLowerCase();
    return this.allHospitals.filter(h => {
      const matchQ    = !q || h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q) || h.specialties.some(s => s.toLowerCase().includes(q));
      const matchCity = this.selectedCity() === 'all' || h.city === this.selectedCity();
      const matchType = this.selectedType() === 'all' || h.type === this.selectedType();
      return matchQ && matchCity && matchType;
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.locateUser();
    }
  }

  locateUser() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocating.set(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.isLocating.set(false);
      },
      () => this.isLocating.set(false)
    );
  }

  openMaps(hospital: Hospital) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`;
    window.open(url, '_blank');
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = { hospital: 'fa-hospital', clinic: 'fa-house-medical', emergency: 'fa-truck-medical', pharmacy: 'fa-prescription-bottle-medical' };
    return map[type] || 'fa-building';
  }

  typeColor(type: string): string {
    const map: Record<string, string> = { hospital: '#6366f1', clinic: '#10b981', emergency: '#ef4444', pharmacy: '#f59e0b' };
    return map[type] || '#6366f1';
  }

  stars(r: number) { return Array(5).fill(0).map((_, i) => i < Math.floor(r) ? 1 : 0); }
}
