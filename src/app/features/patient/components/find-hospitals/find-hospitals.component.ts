import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-find-hospitals',
  imports: [NgIf, NgClass],
  templateUrl: './find-hospitals.component.html',
  styleUrl: './find-hospitals.component.css'
})
export class FindHospitalsComponent implements AfterViewInit {

  activeSection: 'Hospital' | 'Emergency' = 'Hospital';

  ngAfterViewInit() {
    this.loadMap();
  }

  showSection(section: 'Hospital' | 'Emergency') {
    this.activeSection = section;
    if (section === 'Hospital') {
      setTimeout(() => this.loadMap(), 50);
    }
  }

  loadMap() {
    const iframe = document.getElementById('mapFrame') as HTMLIFrameElement;
    if (!iframe) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          iframe.src = `https://www.google.com/maps?q=hospital&ll=${lat},${lng}&z=14&output=embed`;
        },
        err => {
          iframe.src = `https://www.google.com/maps?q=hospital&ll=30.0444,31.2357&z=14&output=embed`;
          console.log("Location blocked", err);
        }
      );
    }
  }

  searchLocation() {
    const input = (document.getElementById('locationInput') as HTMLInputElement).value.trim();
    const iframe = document.getElementById('mapFrame') as HTMLIFrameElement;

    if (input.length === 0) {
      alert("Please enter a location.");
      return;
    }

    iframe.src = `https://www.google.com/maps?q=hospital+in+${encodeURIComponent(input)}&output=embed`;
  }
}

