import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'topbar-widget',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, RippleModule, StyleClassModule, TooltipModule],
  template: `
    <header class="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-surface-900/95 backdrop-blur">
      <div class="w-full h-[72px] px-4 md:px-6 lg:px-8 flex items-center">
        <a class="flex items-center gap-3 cursor-pointer shrink-0" (click)="router.navigate(['/'])">
          <img src="assets/images/LOGO.png" alt="Logo" class="h-12 md:h-14 lg:h-16" />
          <span class="logo-type">
            <span class="brand-blue">ALERTE&nbsp;EMPLOI</span>
            <span class="brand-orange">&nbsp;&</span>
            <span class="brand-green">OFFRES</span>
          </span>
        </a>

        <div class="ml-auto hidden lg:flex items-center gap-10">
          <nav class="flex items-center gap-8">
            <a (click)="router.navigate(['/landing'])" class="nav-link" [class.active]="isActiveRoute('/landing') || isActiveRoute('/')">Accueil</a>
            <a (click)="router.navigate(['/offres'])" class="nav-link" [class.active]="isActiveRoute('/offres')">Offres</a>
            <a (click)="router.navigate(['/services'])" class="nav-link" [class.active]="isActiveRoute('/services')">Nos Services</a>
            <a (click)="router.navigate(['/conseils'])" class="nav-link" [class.active]="isActiveRoute('/conseils')">Conseils</a>
            <a (click)="router.navigate(['/suivre-candidature'])" class="nav-link" [class.active]="isActiveRoute('/suivre-candidature')">Suivre candidature</a>
            <a (click)="router.navigate(['/about'])" class="nav-link" [class.active]="isActiveRoute('/about')">À propos</a>
            <a (click)="router.navigate(['/contact'])" class="nav-link" [class.active]="isActiveRoute('/contact')">Contact</a>
          </nav>

          <!-- ✅ SI NON CONNECTÉ -->
          <div class="flex items-center gap-2" *ngIf="!authService.isAuthenticated()">
            <button pButton pRipple label="Se connecter" [rounded]="true" class="brand-outline" (click)="router.navigate(['/connexion'])"></button>
            <button pButton pRipple label="S'inscrire"   [rounded]="true" class="brand-solid"   (click)="router.navigate(['/register'])"></button>
          </div>

          <!-- ✅ SI CONNECTÉ -->
          <div class="flex items-center gap-2" *ngIf="authService.isAuthenticated()">
            <button pButton pRipple label="Dashboard" icon="pi pi-th-large" [rounded]="true" class="brand-solid" (click)="goToDashboard()"></button>
            <button pButton pRipple icon="pi pi-sign-out" [rounded]="true" class="brand-outline-danger" (click)="logout()" pTooltip="Déconnexion" tooltipPosition="bottom"></button>
          </div>
        </div>

        <!-- ✅ Burger - Version améliorée -->
        <button pButton [text]="true" severity="secondary" [rounded]="true" pRipple
                class="lg:!hidden ml-auto"
                (click)="toggleMobileMenu()">
          <i class="pi" [ngClass]="mobileMenuOpen ? 'pi-times' : 'pi-bars'" [style.fontSize]="'1.5rem'"></i>
        </button>
      </div>

      <!-- Ligne bleue décorative -->
      <div class="blue-decorative-line"></div>

      <!-- ✅ Menu mobile - Version améliorée -->
      <div class="mobile-menu" [class.mobile-menu-open]="mobileMenuOpen">
        <ul class="list-none m-0 p-0 flex flex-col gap-4">
          <li><a (click)="navigateAndClose('/landing')" class="nav-link" [class.active]="isActiveRoute('/landing') || isActiveRoute('/')">Accueil</a></li>
          <li><a (click)="navigateAndClose('/offres')" class="nav-link" [class.active]="isActiveRoute('/offres')">Offres</a></li>
          <li><a (click)="router.navigate(['/services'])" class="nav-link" [class.active]="isActiveRoute('/services')">Nos Services</a></li>
          <li><a (click)="navigateAndClose('/conseils')" class="nav-link" [class.active]="isActiveRoute('/conseils')">Conseils</a></li>
          <li><a (click)="navigateAndClose('/suivre-candidature')" class="nav-link" [class.active]="isActiveRoute('/suivre-candidature')">Suivre candidature</a></li>
          <li><a (click)="navigateAndClose('/about')" class="nav-link" [class.active]="isActiveRoute('/about')">À propos</a></li>
          <li><a (click)="navigateAndClose('/contact')" class="nav-link" [class.active]="isActiveRoute('/contact')">Contact</a></li>
          
          <!-- ✅ MOBILE : SI NON CONNECTÉ -->
          <li class="flex flex-col gap-2 pt-2" *ngIf="!authService.isAuthenticated()">
            <button pButton pRipple label="Se connecter" [rounded]="true" class="brand-outline w-full" (click)="navigateAndClose('/connexion')"></button>
            <button pButton pRipple label="S'inscrire"   [rounded]="true" class="brand-solid w-full"   (click)="navigateAndClose('/register')"></button>
          </li>

          <!-- ✅ MOBILE : SI CONNECTÉ -->
          <li class="flex flex-col gap-2 pt-2" *ngIf="authService.isAuthenticated()">
            <button pButton pRipple label="Dashboard" icon="pi pi-th-large" [rounded]="true" class="brand-solid w-full" (click)="goToDashboardAndClose()"></button>
            <button pButton pRipple label="Déconnexion" icon="pi pi-sign-out" [rounded]="true" class="brand-outline-danger w-full" (click)="logout()"></button>
          </li>
        </ul>
      </div>
    </header>

    <div class="h-[72px]"></div>

    <style>
      :host { 
        --brand-blue: #111d9d; 
        --brand-orange: #ff7104; 
        --brand-green: #0a6c34; 
      }
      
      .brand-blue { color: var(--brand-blue) } 
      .brand-orange { color: var(--brand-orange) } 
      .brand-green { color: var(--brand-green) }
      
      .logo-type {
        display: flex;
        gap: .25rem;
        font-weight: 800;
        line-height: 1;
        font-size: clamp(1.05rem, 1.4vw, 1.35rem);
        letter-spacing: .02em;
      }
      
      .nav-link {
        color: rgba(0,0,0,.85);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        display: block;
        padding: 0.5rem 0;
      }
      
      .nav-link:hover {
        color: var(--brand-blue);
      }
      
      .nav-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--brand-blue);
        transition: width 0.3s ease;
      }
      
      .nav-link:hover::after {
        width: 100%;
      }
      
      .nav-link.active {
        color: var(--brand-blue);
        font-weight: 700;
      }
      
      .nav-link.active::after {
        width: 100%;
      }
      
      .brand-outline.p-button {
        background: transparent;
        border-color: var(--brand-blue);
        color: var(--brand-blue);
        transition: all 0.3s ease;
      }
      
      .brand-outline.p-button:hover {
        background: var(--brand-blue);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(17, 29, 157, 0.2);
      }
      
      .brand-solid.p-button {
        background: var(--brand-green);
        border-color: var(--brand-green);
        color: #fff;
        transition: all 0.3s ease;
      }
      
      .brand-solid.p-button:hover {
        background: #095a2e;
        border-color: #095a2e;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(10, 108, 52, 0.3);
      }

      .brand-outline-danger.p-button {
        background: transparent;
        border-color: #ef4444;
        color: #ef4444;
        transition: all 0.3s ease;
      }
      
      .brand-outline-danger.p-button:hover {
        background: #ef4444;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
      }
      
      .p-button:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-green) 25%, transparent);
      }
      
      .blue-decorative-line {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: var(--brand-blue);
      }

      /* ===== MENU MOBILE ===== */
      .mobile-menu {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        z-index: 50;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        
        /* Animation */
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease-in-out;
      }

      .mobile-menu-open {
        max-height: 600px;
        opacity: 1;
        transform: translateY(0);
      }

      /* Desktop : cache complètement le menu */
      @media (min-width: 1024px) {
        .mobile-menu {
          display: none !important;
        }
      }

      /* Mobile : améliore l'affichage */
      @media (max-width: 1023px) {
        .mobile-menu ul {
          padding: 0.5rem 0;
        }

        .mobile-menu li {
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }

        .mobile-menu li:last-child {
          border-bottom: none;
        }
      }
    </style>
  `
})
export class TopbarWidget implements OnInit {
  @Output() openReservationModalEvent = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
  @Output() createOffer = new EventEmitter<void>();
  
  authService = inject(AuthService);
  
  // ✅ État du menu mobile
  mobileMenuOpen = false;
  
  constructor(public router: Router) {}

  ngOnInit(): void {
    console.log('🎯 TopbarWidget - État auth:', this.authService.isAuthenticated());
  }

  /**
   * ✅ Toggle le menu mobile
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    console.log('🍔 Menu mobile:', this.mobileMenuOpen ? 'OUVERT' : 'FERMÉ');
  }

  /**
   * ✅ Navigue ET ferme le menu mobile
   */
  navigateAndClose(path: string): void {
    this.mobileMenuOpen = false;
    this.router.navigate([path]);
  }

  /**
   * ✅ Va au dashboard ET ferme le menu
   */
  goToDashboardAndClose(): void {
    this.mobileMenuOpen = false;
    this.goToDashboard();
  }

  /**
   * ✅ Redirige vers /dashboard
   */
  goToDashboard(): void {
    const userStr = localStorage.getItem('utilisateur');
    
    if (!userStr) {
      this.router.navigate(['/connexion']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  /**
   * ✅ Déconnexion
   */
  logout(): void {
    console.log('🚪 Déconnexion via AuthService...');
    this.mobileMenuOpen = false; // Ferme le menu
    this.authService.logout();
  }

  openTrackModal(): void { 
    this.openReservationModalEvent.emit(); 
  }

  isActiveRoute(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }
}