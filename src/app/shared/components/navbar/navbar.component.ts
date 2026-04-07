import { Component, OnInit, Inject, PLATFORM_ID, input, Input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupSidebarFunctionality();
    }
  }

  @Input() layout!:string;

  /*sidebar*/
  setupSidebarFunctionality(): void {
    const hamburger = document.querySelector('.hamburger') as HTMLElement | null;
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    const closeSidebarBtn = document.querySelector('.close-sidebar') as HTMLElement | null;
    const overlay = document.querySelector('.overlay') as HTMLElement | null;

    if (!hamburger || !sidebar || !closeSidebarBtn || !overlay) return;

    const openSidebar = () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      sidebar.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      sidebar.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = 'auto';
    };

    hamburger.addEventListener('click', openSidebar);
    hamburger.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') openSidebar();
    });
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    });
  }
}
