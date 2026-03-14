import { TopbarWidget } from './../../landing/components/topbarwidget.component';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { CandidatureService } from './candidature.service';
import { Candidature } from './candidature.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FooterWidget } from '../../landing/components/footerwidget';

// Service

@Component({
  selector: 'app-suivi-candidature',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    RippleModule,
    TopbarWidget,
    FooterWidget
  ],
  providers: [MessageService],
  template: `
    <topbar-widget></topbar-widget>

    <p-toast></p-toast>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-overlay"></div>
      </div>
      
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Suivre ma candidature</h1>
          <p class="hero-subtitle">
            Entrez votre code de candidature pour consulter l'état d'avancement de votre dossier
            et recevoir les dernières informations de nos recruteurs.
          </p>
          <div class="hero-info">
            <div class="info-item">
              <i class="pi pi-search info-icon"></i>
              <span>Recherche instantanée</span>
            </div>
            <div class="info-item">
              <i class="pi pi-clock info-icon"></i>
              <span>Suivi en temps réel</span>
            </div>
            <div class="info-item">
              <i class="pi pi-shield info-icon"></i>
              <span>Données sécurisées</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Search Section -->
      <section class="search-section">
        <div class="search-container">
          <h2 class="search-title">Rechercher ma candidature</h2>
          <p class="search-subtitle">Le code de candidature vous a été envoyé par email lors de votre postulation</p>
          
          <form class="search-form" (ngSubmit)="searchCandidature()" #searchForm="ngForm">
            <div class="search-input-group">
              <label for="candidatureCode" class="input-label">Code de candidature *</label>
              <div class="input-container">
                <i class="pi pi-key input-icon"></i>
                <input 
                  id="candidatureCode"
                  pInputText 
                  type="text" 
                  [(ngModel)]="searchCode" 
                  name="searchCode"
                  placeholder="Ex: CAND-2025-ABC123" 
                  class="search-input"
                  required
                  maxlength="20"
                  #codeInput="ngModel"
                />
              </div>
              <small class="input-help" *ngIf="!codeInput.valid && codeInput.touched">
                Le code de candidature est obligatoire
              </small>
            </div>
            
            <button 
              pButton 
              pRipple 
              type="submit" 
              label="Rechercher ma candidature" 
              icon="pi pi-search"
              class="search-btn"
              [loading]="searching"
              [disabled]="!searchForm.valid">
            </button>
          </form>
        </div>
      </section>

      <!-- Results Section -->
      <section class="results-section" *ngIf="candidatureResult">
        <div class="results-container">
          <div class="candidature-card">
            <!-- Header avec statut -->
            <div class="card-header">
              <div class="candidature-info">
                <h3 class="candidature-title">{{ candidatureResult.offreTitre || candidatureResult.offre?.titre }}</h3>
                <div class="candidature-meta">
                  <span class="candidate">{{ candidatureResult.fullName }}</span>
                  <span class="separator">•</span>
                  <span class="email">{{ candidatureResult.email }}</span>
                </div>
              </div>
              <div class="status-badge" [ngClass]="getStatusClass(candidatureResult.statut)">
                <i [class]="getStatusIcon(candidatureResult.statut)"></i>
                <span>{{ getStatusLabel(candidatureResult.statut) }}</span>
              </div>
            </div>

            <!-- Timeline du processus -->
            <div class="timeline-section">
              <h4 class="timeline-title">Suivi de votre candidature</h4>
              <div class="timeline">
                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('en_attente', candidatureResult.statut)"
                     [class.current]="isStepCurrent('en_attente', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-send"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Candidature envoyée</h5>
                    <p>Votre dossier a été reçu avec succès</p>
                    <small>{{ candidatureResult.created_at | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('en_cours', candidatureResult.statut)"
                     [class.current]="isStepCurrent('en_cours', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-eye"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Examen du dossier</h5>
                    <p>Nos recruteurs analysent votre profil</p>
                    <small *ngIf="candidatureResult.dateExamen">{{ candidatureResult.dateExamen | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('entretien', candidatureResult.statut)"
                     [class.current]="isStepCurrent('entretien', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Entretien</h5>
                    <p>Rencontre avec l'équipe de recrutement</p>
                    <small *ngIf="candidatureResult.dateEntretien">{{ candidatureResult.dateEntretien | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('acceptee', candidatureResult.statut) || isStepCompleted('refusee', candidatureResult.statut)"
                     [class.current]="isStepCurrent('acceptee', candidatureResult.statut) || isStepCurrent('refusee', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i [class]="candidatureResult.statut === 'acceptee' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Décision finale</h5>
                    <p>Résultat de votre candidature</p>
                    <small *ngIf="candidatureResult.dateDecision">{{ candidatureResult.dateDecision | date:'medium' }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Détails de la candidature -->
            <div class="details-section">
              <h4 class="details-title">Détails de votre candidature</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Code de suivi</span>
                  <span class="detail-value">{{ candidatureResult.code || searchCode }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date de candidature</span>
                  <span class="detail-value">{{ candidatureResult.created_at | date:'mediumDate' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nom complet</span>
                  <span class="detail-value">{{ candidatureResult.fullName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Téléphone</span>
                  <span class="detail-value">{{ candidatureResult.telephone || 'Non renseigné' }}</span>
                </div>
              </div>
            </div>

            <!-- Lettre de motivation -->
            <div class="motivation-section" *ngIf="candidatureResult.motivationText || candidatureResult.lm_dl">
              <h4 class="motivation-title">Lettre de motivation</h4>
              <div class="motivation-content">
                <div *ngIf="candidatureResult.lm_dl; else textMotivation" class="file-motivation">
                  <i class="pi pi-file motivation-file-icon"></i>
                  <span>Lettre de motivation fournie en fichier</span>
                  <a [href]="candidatureResult.lm_dl" target="_blank" class="download-motivation-link">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
                <ng-template #textMotivation>
                  <div class="text-motivation">
                    {{ candidatureResult.motivationText }}
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- Fichiers joints -->
            <div class="files-section" *ngIf="candidatureResult.cv_dl || candidatureResult.lm_dl">
              <h4 class="files-title">Fichiers joints</h4>
              <div class="files-list">
                <div class="file-item" *ngIf="candidatureResult.cv_dl">
                  <i class="pi pi-file file-icon"></i>
                  <span class="file-name">CV</span>
                  <a [href]="candidatureResult.cv_dl" target="_blank" class="file-download">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
                <div class="file-item" *ngIf="candidatureResult.lm_dl">
                  <i class="pi pi-file file-icon"></i>
                  <span class="file-name">Lettre de motivation</span>
                  <a [href]="candidatureResult.lm_dl" target="_blank" class="file-download">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions-section">
              <button pButton pRipple label="Renvoyer l'email" icon="pi pi-envelope" class="email-btn" (click)="resendConfirmationEmail()"></button>
              <button pButton pRipple label="Imprimer" icon="pi pi-print" class="print-btn" (click)="printCandidature()"></button>
              <button pButton pRipple label="Télécharger PDF" icon="pi pi-download" class="download-btn" (click)="downloadPDF()"></button>
            </div>
          </div>
        </div>
      </section>

      <!-- No Results -->
      <section class="no-results" *ngIf="searchPerformed && !candidatureResult">
        <div class="no-results-content">
          <i class="pi pi-search no-results-icon"></i>
          <h3 class="no-results-title">Candidature introuvable</h3>
          <p class="no-results-message">
            Aucune candidature ne correspond à ce code. Vérifiez votre saisie ou contactez notre support.
          </p>
          <div class="help-actions">
            <button pButton pRipple label="Réessayer" icon="pi pi-refresh" [text]="true" (click)="resetSearch()"></button>
            <button pButton pRipple label="Contacter le support" icon="pi pi-envelope" [outlined]="true" (click)="contactSupport()"></button>
          </div>
        </div>
      </section>
    </div>
    <app-footer-widget></app-footer-widget>
  `,
  styles: [`
  :host {
    --primary-blue: #111d9d;
    --accent-orange: #ff7104;
    --success-green: #0a6c34;
    --text-dark: #1e293b;
    --text-medium: #64748b;
    --text-light: #94a3b8;
    --bg-light: #f8fafc;
    --border-light: #e2e8f0;
    --white: #ffffff;
  }

  /* ===== ANIMATIONS ===== */
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(0.95); }
  }

  @keyframes pulseBadge {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
    50%       { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
  }

  /* ===== HERO SECTION ===== */
  .hero-section {
    background: #111d9d;
    padding: 5rem 2rem 4rem;
    text-align: center;
    overflow: hidden;
    position: relative;
  }

  /* Formes décoratives discrètes */
  .hero-section::before {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    top: -150px; right: -100px;
    pointer-events: none;
  }

  .hero-section::after {
    content: '';
    position: absolute;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    bottom: -80px; left: -60px;
    pointer-events: none;
  }

  .hero-background { display: none; }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 800;
    color: white;
    line-height: 1.15;
    margin-bottom: 1.25rem;
    letter-spacing: -0.02em;
    -webkit-text-fill-color: unset;
    background: none;
    animation: fadeInDown 0.7s ease-out 0.1s both;
  }

  .hero-subtitle {
    font-size: 1.125rem;
    color: rgba(255,255,255,0.8);
    line-height: 1.7;
    margin-bottom: 2.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    animation: fadeIn 0.7s ease-out 0.4s both;
  }

  .hero-info {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    animation: fadeInUp 0.7s ease-out 0.6s both;
  }

  .info-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.12);
    color: white;
    padding: 0.5rem 1.25rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid rgba(255,255,255,0.2);
    transition: all 0.3s ease;
    animation: pulseBadge 3s ease-in-out infinite;
  }

  .info-item:hover {
    background: rgba(255,255,255,0.2);
    transform: translateY(-2px);
  }

  .info-icon {
    font-size: 0.875rem;
    color: #ff7104;
  }

  /* ===== MAIN CONTENT ===== */
  .main-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* ===== SEARCH SECTION ===== */
  .search-section {
    padding: 3rem 0 4rem;
  }

  .search-container {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
    background: white;
    padding: 3rem;
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    animation: fadeInUp 0.7s ease-out 0.2s both;
  }

  .search-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111d9d;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
    -webkit-text-fill-color: unset;
    background: none;
  }

  .search-subtitle {
    color: var(--text-medium);
    margin-bottom: 2rem;
    line-height: 1.6;
    font-size: 0.9375rem;
  }

  .search-form { text-align: left; }

  .search-input-group { margin-bottom: 1.5rem; }

  .input-label {
    display: block;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0.625rem;
    font-size: 0.9375rem;
  }

  .input-container { position: relative; }

  .input-icon {
    position: absolute;
    left: 1.125rem;
    top: 50%;
    transform: translateY(-50%);
    color: #111d9d;
    z-index: 2;
    font-size: 1rem;
  }

  .search-input {
    width: 100% !important;
    padding: 0.875rem 1.125rem 0.875rem 3rem !important;
    border: 2px solid #e2e8f0 !important;
    border-radius: 0.75rem !important;
    font-size: 1rem !important;
    transition: all 0.3s ease !important;
    background: #f8fafc !important;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .search-input:focus {
    border-color: #111d9d !important;
    box-shadow: 0 0 0 3px rgba(17,29,157,0.1) !important;
    background: white !important;
    outline: none !important;
  }

  .input-help {
    color: #dc2626;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    display: block;
    font-weight: 500;
  }

  .search-btn {
    width: 100% !important;
    padding: 1rem 2rem !important;
    background: #111d9d !important;
    border: none !important;
    font-size: 1rem !important;
    font-weight: 700 !important;
    transition: all 0.3s ease !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 4px 12px rgba(17,29,157,0.25) !important;
    color: white !important;
  }

  .search-btn:not([disabled]):hover {
    background: #0d1784 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(17,29,157,0.35) !important;
  }

  .search-btn[disabled] { opacity: 0.5; cursor: not-allowed; }

  /* ===== CANDIDATURE CARD ===== */
  .results-section { padding: 0 0 4rem; }

  .candidature-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    overflow: hidden;
    border: 1px solid #e2e8f0;
    animation: fadeInUp 0.6s ease-out both;
  }

  .card-header {
    background: #111d9d;
    padding: 1.75rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .candidature-title {
    font-size: 1.375rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.01em;
  }

  .candidature-meta {
    color: rgba(255,255,255,0.75);
    font-size: 0.9rem;
  }

  .separator { margin: 0 0.5rem; opacity: 0.5; }

  /* ===== STATUS BADGES ===== */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.125rem;
    border-radius: 2rem;
    font-weight: 700;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .status-badge.submitted   { background: #e0e7ff; color: #3730a3; }
  .status-badge.reviewing   { background: #fef3c7; color: #92400e; }
  .status-badge.interview   { background: #ddd6fe; color: #5b21b6; }
  .status-badge.accepted    { background: #dcfce7; color: #166534; }
  .status-badge.rejected    { background: #fee2e2; color: #dc2626; }
  .status-badge.on-hold     { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }

  /* ===== SECTIONS INTERNES ===== */
  .timeline-section,
  .details-section,
  .motivation-section,
  .files-section {
    padding: 1.75rem 2rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .timeline-title,
  .details-title,
  .motivation-title,
  .files-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .timeline-title::before  { content: '📋'; }
  .details-title::before   { content: '📄'; }
  .motivation-title::before{ content: '✉️'; }
  .files-title::before     { content: '📎'; }

  /* ===== TIMELINE ===== */
  .timeline { position: relative; padding-left: 0.5rem; }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0.9375rem;
    top: 0; bottom: 0;
    width: 2px;
    background: #e2e8f0;
  }

  .timeline-item {
    display: flex;
    gap: 1.25rem;
    margin-bottom: 1.75rem;
    position: relative;
  }

  .timeline-item:last-child { margin-bottom: 0; }

  .timeline-marker {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: white;
    border: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 2;
    font-size: 0.75rem;
    color: #94a3b8;
    transition: all 0.3s ease;
  }

  .timeline-item.completed .timeline-marker {
    background: #0a6c34;
    border-color: #0a6c34;
    color: white;
  }

  .timeline-item.current .timeline-marker {
    background: #111d9d;
    border-color: #111d9d;
    color: white;
    box-shadow: 0 0 0 4px rgba(17,29,157,0.15);
  }

  .timeline-content h5 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0.125rem 0 0.25rem;
  }

  .timeline-content p {
    color: #64748b;
    margin: 0 0 0.375rem;
    font-size: 0.875rem;
  }

  .timeline-content small { color: #94a3b8; font-size: 0.75rem; }

  /* ===== DETAILS GRID ===== */
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
  }

  .detail-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value { font-weight: 700; color: #1e293b; font-size: 0.9375rem; }

  /* ===== MOTIVATION & FILES ===== */
  .motivation-content {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
  }

  .file-motivation {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .motivation-file-icon { color: #111d9d; font-size: 1.25rem; }

  .download-motivation-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: #111d9d;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.875rem;
    margin-left: auto;
    padding: 0.375rem 0.875rem;
    border-radius: 0.5rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    transition: all 0.2s ease;
  }

  .download-motivation-link:hover { background: #dbeafe; }

  .text-motivation {
    color: #475569;
    line-height: 1.7;
    white-space: pre-line;
    font-size: 0.9375rem;
  }

  .files-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #f8fafc;
    padding: 0.875rem 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    transition: border-color 0.2s ease;
  }

  .file-item:hover { border-color: #111d9d; }

  .file-icon { color: #0a6c34; font-size: 1.25rem; flex-shrink: 0; }
  .file-name { flex: 1; font-weight: 600; color: #1e293b; font-size: 0.9rem; }

  .file-download {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: #111d9d;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.8rem;
    padding: 0.375rem 0.875rem;
    border-radius: 0.5rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    transition: all 0.2s ease;
  }

  .file-download:hover { background: #dbeafe; }

  /* ===== ACTIONS SECTION ===== */
  .actions-section {
    padding: 1.75rem 2rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    background: #f8fafc;
  }

  .email-btn, .print-btn, .download-btn {
    padding: 0.875rem 1.75rem !important;
    font-weight: 700 !important;
    border-radius: 0.75rem !important;
    font-size: 0.9rem !important;
    transition: all 0.3s ease !important;
    border: none !important;
  }

  .email-btn {
    background: #111d9d !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(17,29,157,0.25) !important;
  }

  .email-btn:hover {
    background: #0d1784 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(17,29,157,0.35) !important;
  }

  .print-btn {
    background: #64748b !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(100,116,139,0.2) !important;
  }

  .print-btn:hover {
    background: #475569 !important;
    transform: translateY(-2px) !important;
  }

  .download-btn {
    background: #ff7104 !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(255,113,4,0.25) !important;
  }

  .download-btn:hover {
    background: #ea580c !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(255,113,4,0.35) !important;
  }

  /* ===== NO RESULTS ===== */
  .no-results { padding: 3rem 0 5rem; }

  .no-results-content {
    max-width: 500px;
    margin: 0 auto;
    background: white;
    padding: 3rem;
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    text-align: center;
    animation: fadeInUp 0.6s ease-out both;
  }

  .no-results-icon {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1.5rem;
    display: inline-block;
    animation: pulse 2.5s ease-in-out infinite;
  }

  .no-results-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.75rem;
  }

  .no-results-message {
    color: #64748b;
    line-height: 1.7;
    margin-bottom: 2rem;
    font-size: 0.9375rem;
  }

  .help-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .hero-section  { padding: 3.5rem 1.5rem 3rem; }
    .hero-title    { font-size: 2rem; }
    .hero-subtitle { font-size: 1rem; }
    .hero-info     { gap: 0.75rem; }

    .search-container { padding: 2rem 1.5rem; }
    .search-title { font-size: 1.5rem; }

    .card-header { flex-direction: column; }
    .timeline-section, .details-section,
    .motivation-section, .files-section,
    .actions-section { padding: 1.5rem; }

    .details-grid { grid-template-columns: 1fr; }

    .actions-section { flex-direction: column; align-items: stretch; }
    .email-btn, .print-btn, .download-btn { width: 100%; }

    .help-actions { flex-direction: column; }
  }
`]
})
export class SuiviCandidatureComponent implements OnInit {
  searchCode: string = '';
  searching: boolean = false;
  searchPerformed: boolean = false;
  candidatureResult: any = null;
  
  candidatures = signal<Candidature[]>([]);
  constructor(
    private messageService: MessageService,
    private router: Router,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    console.log('Composant Suivi Candidature initialisé');
  }

  searchCandidature(): void {
    if (!this.searchCode?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez saisir un code de candidature'
      });
      return;
    }

    console.log('Recherche candidature avec code:', this.searchCode.trim());

    this.searching = true;
    this.searchPerformed = false;

    // Appel réel à l'API via votre service
    this.candidatureService.findByCode(this.searchCode.trim()).subscribe({
      next: (data:Candidature) => {
        console.log('Candidature trouvée:', data);
        this.candidatureResult = data;
        this.searchPerformed = true;
        this.searching = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Candidature trouvée',
          detail: `Candidature de ${data.fullName} pour le poste de ${data.offreTitre}`,
          life: 3000
        });
      },
      error: (error:any) => {
        console.error('Erreur recherche candidature:', error);
        this.candidatureResult = null;
        this.searchPerformed = true;
        this.searching = false;
        
        // Afficher le message d'erreur approprié
        let errorMessage = error.message || 'Une erreur est survenue lors de la recherche';
        let errorSummary = 'Erreur';
        
        if (error.code === 'NOT_FOUND') {
          errorSummary = 'Candidature introuvable';
          errorMessage = 'Aucune candidature ne correspond à ce code. Vérifiez votre saisie.';
        } else if (error.code === 'INVALID_FORMAT') {
          errorSummary = 'Code invalide';
          errorMessage = 'Le format du code est incorrect. Format attendu: CAND-ANNÉE-XXXXXX';
        } else if (error.code === 'NETWORK_ERROR') {
          errorSummary = 'Erreur de connexion';
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: errorSummary,
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  // Fonction pour renvoyer l'email de confirmation
  resendConfirmationEmail(): void {
    if (!this.candidatureResult?.code) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune candidature sélectionnée'
      });
      return;
    }

    console.log('Renvoi email pour code:', this.candidatureResult.code);

    this.candidatureService.resendEmail(this.candidatureResult.code).subscribe({
      next: (response:any) => {
        console.log('Email renvoyé:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Email envoyé',
          detail: response.message || 'L\'email de confirmation a été renvoyé avec succès',
          life: 3000
        });
      },
      error: (error:any) => {
        console.error('Erreur renvoi email:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible d\'envoyer l\'email',
          life: 5000
        });
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'submitted';
      case 'en_cours': return 'reviewing';
      case 'entretien': return 'interview';
      case 'acceptee': return 'accepted';
      case 'refusee': return 'rejected';
      default: return 'on-hold';
    }
  }

  getStatusIcon(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'pi pi-clock';
      case 'en_cours': return 'pi pi-eye';
      case 'entretien': return 'pi pi-users';
      case 'acceptee': return 'pi pi-check-circle';
      case 'refusee': return 'pi pi-times-circle';
      default: return 'pi pi-question-circle';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours d\'examen';
      case 'entretien': return 'Entretien programmé';
      case 'acceptee': return 'Candidature acceptée';
      case 'refusee': return 'Candidature refusée';
      default: return 'Statut inconnu';
    }
  }

  isStepCompleted(step: string, currentStatus: string): boolean {
    const statusOrder = ['en_attente', 'en_cours', 'entretien', 'acceptee', 'refusee'];
    const stepIndex = statusOrder.indexOf(step);
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex > stepIndex;
  }

  isStepCurrent(step: string, currentStatus: string): boolean {
    return step === currentStatus;
  }

  resetSearch(): void {
    this.searchCode = '';
    this.candidatureResult = null;
    this.searchPerformed = false;
  }

  contactSupport(): void {
    window.open('mailto:support@alertemploi.com?subject=Aide pour le suivi de candidature', '_blank');
  }

  printCandidature(): void {
    window.print();
  }

async downloadPDF(): Promise<void> {
  if (!this.candidatureResult) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Aucune candidature à exporter',
      life: 3000
    });
    return;
  }

  try {
    this.messageService.add({
      severity: 'info',
      summary: 'Génération PDF',
      detail: 'Création du document...',
      life: 5000
    });

    // Créer le PDF avec du texte natif pour une qualité maximale
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 20;
    const rightMargin = 20;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    let yPosition = 20;

    // ===== EN-TÊTE =====
    // Logo ou titre principal
    pdf.setFontSize(24);
    pdf.setTextColor(17, 29, 157); // primary-blue
    pdf.setFont('helvetica', 'bold');
    pdf.text('Suivi de Candidature', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date de génération
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Ligne de séparation
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 15;

    // ===== INFORMATIONS DE L'OFFRE =====
    // Titre de l'offre avec badge de statut
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.candidatureResult.offreTitre || 'Poste non spécifié', leftMargin, yPosition);
    
    // Badge de statut (à droite)
    const statusText = this.getStatusLabel(this.candidatureResult.statut);
    const statusColor = this.getStatusColor(this.candidatureResult.statut);
    pdf.setFontSize(10);
    pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
    pdf.setFont('helvetica', 'bold');
    
    // Dessiner le badge
    const statusWidth = pdf.getTextWidth(statusText) + 10;
    const statusX = pageWidth - rightMargin - statusWidth;
    pdf.setFillColor(statusColor.bg.r, statusColor.bg.g, statusColor.bg.b);
    pdf.roundedRect(statusX, yPosition - 6, statusWidth, 8, 2, 2, 'F');
    pdf.text(statusText, statusX + statusWidth/2, yPosition - 1, { align: 'center' });
    yPosition += 10;

    // Informations du candidat
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${this.candidatureResult.fullName} • ${this.candidatureResult.email || 'Email non renseigné'}`, leftMargin, yPosition);
    yPosition += 15;

    // ===== TIMELINE =====
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Suivi de votre candidature', leftMargin, yPosition);
    yPosition += 10;

    // Étapes du processus
    const steps = [
      {
        title: 'Candidature envoyée',
        description: 'Votre dossier a été reçu avec succès',
        date: this.candidatureResult.created_at,
        status: this.getStepStatus('en_attente', this.candidatureResult.statut),
        icon: '✓'
      },
      {
        title: 'Examen du dossier',
        description: 'Nos recruteurs analysent votre profil',
        date: this.candidatureResult.dateExamen,
        status: this.getStepStatus('en_cours', this.candidatureResult.statut),
        icon: '⚬'
      },
      {
        title: 'Entretien',
        description: 'Rencontre avec l\'équipe de recrutement',
        date: this.candidatureResult.dateEntretien,
        status: this.getStepStatus('entretien', this.candidatureResult.statut),
        icon: '⚬'
      },
      {
        title: 'Décision finale',
        description: 'Résultat de votre candidature',
        date: this.candidatureResult.dateDecision,
        status: this.getStepStatus('acceptee', this.candidatureResult.statut),
        icon: this.candidatureResult.statut === 'acceptee' ? '✓' : '✗'
      }
    ];

    steps.forEach((step, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      // Dessiner le marqueur
      const markerX = leftMargin + 5;
      if (step.status === 'completed') {
        pdf.setFillColor(10, 108, 52); // success-green
        pdf.setTextColor(255, 255, 255);
      } else if (step.status === 'current') {
        pdf.setFillColor(17, 29, 157); // primary-blue
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setFillColor(226, 232, 240); // border-light
        pdf.setTextColor(148, 163, 184);
      }
      
      pdf.circle(markerX, yPosition, 3, 'F');
      pdf.setFontSize(8);
      pdf.text(step.icon, markerX, yPosition + 1, { align: 'center' });

      // Ligne de connexion (sauf pour le dernier)
      if (index < steps.length - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(markerX, yPosition + 3, markerX, yPosition + 20);
      }

      // Texte de l'étape
      const textX = leftMargin + 15;
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(step.title, textX, yPosition);
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(step.description, textX, yPosition + 5);
      
      if (step.date) {
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const formattedDate = new Date(step.date).toLocaleDateString('fr-FR');
        pdf.text(formattedDate, textX, yPosition + 10);
      }
      
      yPosition += 25;
    });

    yPosition += 10;

    // ===== DÉTAILS DE LA CANDIDATURE =====
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Détails de votre candidature', leftMargin, yPosition);
    yPosition += 10;

    // Créer un tableau de détails
    const details = [
      { label: 'Code de suivi', value: this.candidatureResult.code || this.searchCode },
      { label: 'Date de candidature', value: new Date(this.candidatureResult.created_at).toLocaleDateString('fr-FR') },
      { label: 'Nom complet', value: this.candidatureResult.fullName },
      { label: 'Téléphone', value: this.candidatureResult.telephone || 'Non renseigné' }
    ];

    // Dessiner le tableau
    pdf.setFontSize(10);
    const colWidth = contentWidth / 2;
    
    details.forEach((detail, index) => {
      const x = leftMargin + (index % 2) * colWidth;
      const y = yPosition + Math.floor(index / 2) * 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(detail.label, x, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(detail.value, x, y + 5);
    });

    yPosition += 35;

    // ===== LETTRE DE MOTIVATION =====
    if (this.candidatureResult.motivationText || this.candidatureResult.lm_dl) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lettre de motivation', leftMargin, yPosition);
      yPosition += 8;

      if (this.candidatureResult.lm_dl) {
        // Fichier joint
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 15, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(17, 29, 157);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📎 Lettre de motivation fournie en fichier', leftMargin + 5, yPosition + 2);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition + 2);
        yPosition += 20;
      } else if (this.candidatureResult.motivationText) {
        // Texte
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(this.candidatureResult.motivationText, contentWidth);
        pdf.text(lines, leftMargin, yPosition);
        yPosition += lines.length * 4 + 10;
      }
    }

    // ===== FICHIERS JOINTS =====
    if (this.candidatureResult.cv_dl || this.candidatureResult.lm_dl) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fichiers joints', leftMargin, yPosition);
      yPosition += 10;

      if (this.candidatureResult.cv_dl) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 12, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(10, 108, 52);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📄 CV', leftMargin + 5, yPosition);
        
        pdf.setTextColor(17, 29, 157);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition);
        yPosition += 15;
      }

      if (this.candidatureResult.lm_dl) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 12, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(10, 108, 52);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📄 Lettre de motivation', leftMargin + 5, yPosition);
        
        pdf.setTextColor(17, 29, 157);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition);
        yPosition += 15;
      }
    }

    // ===== PIED DE PAGE SUR TOUTES LES PAGES =====
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Ligne de séparation
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(leftMargin, pageHeight - 20, pageWidth - rightMargin, pageHeight - 20);
      
      // Numéro de page
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Copyright
      pdf.setFontSize(8);
      pdf.text('© 2025 Alerte Emploi - Document confidentiel', pageWidth / 2, pageHeight - 7, { align: 'center' });
    }

    // Sauvegarder le PDF
    const fileName = this.candidatureResult.code 
      ? `candidature-${this.candidatureResult.code}.pdf`
      : `candidature-${new Date().getTime()}.pdf`;
    
    pdf.save(fileName);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF généré',
      detail: `Document ${fileName} téléchargé avec succès`,
      life: 3000
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de générer le PDF',
      life: 5000
    });
  }
}

// Méthodes helper pour le PDF
private getStatusColor(statut: string): any {
  switch (statut) {
    case 'en_attente':
      return { r: 55, g: 48, b: 163, bg: { r: 224, g: 231, b: 255 } };
    case 'en_cours':
      return { r: 146, g: 64, b: 14, bg: { r: 254, g: 243, b: 199 } };
    case 'acceptee':
      return { r: 22, g: 101, b: 52, bg: { r: 220, g: 252, b: 231 } };
    case 'refusee':
      return { r: 220, g: 38, b: 38, bg: { r: 254, g: 226, b: 226 } };
    default:
      return { r: 71, g: 85, b: 105, bg: { r: 241, g: 245, b: 249 } };
  }
}

private getStepStatus(step: string, currentStatus: string): string {
  const statusOrder = ['en_attente', 'en_cours', 'entretien', 'acceptee', 'refusee'];
  const stepIndex = statusOrder.indexOf(step);
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentIndex > stepIndex) return 'completed';
  if (currentIndex === stepIndex) return 'current';
  return 'pending';
}
}