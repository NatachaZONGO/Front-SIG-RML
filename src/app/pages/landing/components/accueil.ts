import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `
    <section class="hero">

      <!-- Image plein fond -->
      <img [src]="backgroundImage" alt="hero" class="hero-bg-img" />

      <!-- Overlay coloré uniquement sur la gauche -->
      <div class="hero-overlay"></div>

      <!-- Contenu -->
      <div class="hero-body">

        <!-- Texte gauche -->
        <div class="hero-text">

          <div class="hero-badge">
            <i class="pi pi-star-fill"></i>
            Plateforme #1 au Burkina Faso
          </div>

          <h1 class="hero-title">
            <span class="brand-line">
              <span class="c-blue">Alerte&nbsp;Emploi</span>
              <span class="c-orange">&nbsp;&amp;&nbsp;</span>
              <span class="c-green">Offres</span>
            </span>
            <span class="hero-slogan">
              Trouve l'opportunité<br>qui te correspond
            </span>
          </h1>

          <p class="hero-desc">
            Explore des centaines d'offres, suis tes candidatures
            et publie des annonces depuis une seule plateforme.
          </p>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-num">500+</span>
              <span class="stat-lbl">Offres actives</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat-item">
              <span class="stat-num">1000+</span>
              <span class="stat-lbl">Candidats</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat-item">
              <span class="stat-num">50+</span>
              <span class="stat-lbl">Entreprises</span>
            </div>
          </div>

          <div class="hero-actions">
            <button pButton pRipple
              label="Voir les offres"
              icon="pi pi-briefcase"
              class="btn-a"
              (click)="router.navigate(['/offres'])">
            </button>
            <button pButton pRipple
              label="Publier une offre"
              icon="pi pi-plus"
              class="btn-b"
              (click)="router.navigate(['/publier-offre'])">
            </button>
          </div>
        </div>

        <!-- Logo flottant à droite -->
        <div class="hero-logo-card">
          <img [src]="heroImage" alt="Logo" class="logo-img" />
        </div>

      </div>
    </section>

    <style>
      @keyframes fadeInDown {
        from { opacity:0; transform:translateY(-16px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes fadeInUp {
        from { opacity:0; transform:translateY(24px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity:0; }
        to   { opacity:1; }
      }
      @keyframes floatLogo {
        0%,100% { transform:translateY(0); }
        50%     { transform:translateY(-8px); }
      }
      @keyframes pulseBadge {
        0%,100% { box-shadow:0 0 0 0 rgba(255,113,4,0.4); }
        50%     { box-shadow:0 0 0 8px rgba(255,113,4,0); }
      }

      /* ===== HERO ===== */
      .hero {
        position: relative;
        min-height: 520px;
        display: flex;
        align-items: center;
        overflow: hidden;
      }

      /* Image plein fond */
      .hero-bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        z-index: 1;
      }

      /* Overlay : bleu foncé à gauche, transparent à droite */
      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 2;
        background: linear-gradient(
          to right,
          rgba(17,29,157,0.95) 0%,
          rgba(17,29,157,0.92) 30%,
          rgba(17,29,157,0.70) 50%,
          rgba(17,29,157,0.20) 70%,
          rgba(17,29,157,0.00) 100%
        );
      }

      /* Contenu */
      .hero-body {
        position: relative;
        z-index: 3;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
      }

      /* Texte — max 55% */
      .hero-text {
        max-width: 560px;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      /* Badge */
      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #ff7104;
        color: white;
        padding: 0.45rem 1.125rem;
        border-radius: 2rem;
        font-size: 0.8rem;
        font-weight: 700;
        width: fit-content;
        animation: fadeInDown 0.5s ease-out 0.1s both,
                   pulseBadge 2.5s ease-in-out 1.5s infinite;
      }

      /* Titre */
      .hero-title {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        animation: fadeInUp 0.6s ease-out 0.25s both;
      }

      .brand-line {
        font-size: 1.625rem;
        font-weight: 800;
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
      }

      .c-blue  { color: white; }
      .c-orange{ color: #ff7104; }
      .c-green { color: #4ade80; }

      .hero-slogan {
        font-size: 3rem;
        font-weight: 800;
        color: white;
        line-height: 1.15;
        letter-spacing: -0.025em;
      }

      /* Description */
      .hero-desc {
        font-size: 1rem;
        color: rgba(255,255,255,0.78);
        line-height: 1.7;
        margin: 0;
        animation: fadeIn 0.7s ease-out 0.45s both;
      }

      /* Stats */
      .hero-stats {
        display: flex;
        align-items: center;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 0.875rem;
        padding: 1rem 0;
        width: fit-content;
        animation: fadeInUp 0.6s ease-out 0.55s both;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 1.5rem;
      }

      .stat-num {
        font-size: 1.625rem;
        font-weight: 800;
        color: #ff7104;
        line-height: 1;
      }

      .stat-lbl {
        font-size: 0.7rem;
        color: rgba(255,255,255,0.6);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 0.25rem;
        white-space: nowrap;
      }

      .stat-sep {
        width: 1px;
        height: 32px;
        background: rgba(255,255,255,0.15);
        flex-shrink: 0;
      }

      /* Boutons */
      .hero-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        animation: fadeInUp 0.6s ease-out 0.65s both;
      }

      :host ::ng-deep .btn-a.p-button {
        background: #ff7104 !important;
        border-color: #ff7104 !important;
        color: white !important;
        font-weight: 700 !important;
        padding: 0.875rem 2rem !important;
        border-radius: 0.75rem !important;
        box-shadow: 0 4px 12px rgba(255,113,4,0.35) !important;
        transition: all 0.3s ease !important;
      }
      :host ::ng-deep .btn-a.p-button:hover {
        background: #ea580c !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(255,113,4,0.45) !important;
      }

      :host ::ng-deep .btn-b.p-button {
        background: transparent !important;
        border: 2px solid rgba(255,255,255,0.6) !important;
        color: white !important;
        font-weight: 700 !important;
        padding: 0.875rem 2rem !important;
        border-radius: 0.75rem !important;
        transition: all 0.3s ease !important;
      }
      :host ::ng-deep .btn-b.p-button:hover {
        background: rgba(255,255,255,0.15) !important;
        border-color: white !important;
        transform: translateY(-2px) !important;
      }

      /* Logo flottant — bien dans la zone droite visible */
      .hero-logo-card {
        background: white;
        border-radius: 1.25rem;
        padding: 1rem 1.5rem;
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        animation: floatLogo 3s ease-in-out infinite,
                   fadeIn 0.8s ease-out 0.5s both;
        border: 1px solid rgba(17,29,157,0.06);
        flex-shrink: 0;
        margin-right: 2rem;
      }

      .logo-img {
        width: 140px;
        height: auto;
        display: block;
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .hero-logo-card { display: none; }
        .hero-slogan    { font-size: 2.5rem; }
      }

      @media (max-width: 768px) {
        .hero-body   { padding: 3rem 1.5rem; }
        .hero-slogan { font-size: 2rem; }
        .brand-line  { font-size: 1.375rem; }
        .hero-actions { flex-direction: column; }

        :host ::ng-deep .btn-a.p-button,
        :host ::ng-deep .btn-b.p-button {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  `
})
export class Accueil {
  backgroundImage = '/assets/images/Hero.jpg';
  heroImage = '/assets/images/LOGO.png';

  constructor(public router: Router) {}
}