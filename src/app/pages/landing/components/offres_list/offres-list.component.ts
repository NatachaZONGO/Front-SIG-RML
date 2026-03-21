import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ActivatedRoute, Router } from '@angular/router';
import { TopbarWidget } from '../topbarwidget.component';
import { OffreService } from '../../../crud/offre/offre.service';
import { enrichOffreForUi, Offre } from '../../../crud/offre/offre.model';
import { AuthService } from '../../../auth/auth.service';
import { ProfileService } from '../../../crud/profil/profil.service';
import { FooterWidget } from '../footerwidget';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  selector: 'app-offres-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TagModule, PaginatorModule,
    InputTextModule, DialogModule, InputNumberModule, TextareaModule,
    CheckboxModule, RadioButtonModule, SelectModule, ToastModule, FooterWidget, TopbarWidget
  ],
  templateUrl: './offres-list.component.html',
  providers: [MessageService],
  styles: [`
    .field-readonly {
      background: #f3f4f6 !important;
      border: 2px solid #e5e7eb !important;
      cursor: not-allowed;
    }
    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }
  `]
})
export class OffresListComponent implements OnInit {
  all = signal<Offre[]>([]);
  q = '';
  page = 0;
  rows = 9;
  
  detailsVisible = false;
  selectedOffre?: Offre;
  
  applyVisible = false;
  isAuth = false;
  userRole = '';
  isCandidat = false;
  candidatProfile: any = null;
  profileLoaded = false; // ✅ Flag pour savoir si le profil est chargé
  today = new Date().toISOString().slice(0, 10);
  cvFile?: File | null;
  lmFile?: File | null;
  routeOfferId: string | null = null;
  highlightId: number | null = null;

  selectedOffreSafeHtml: SafeHtml | null = null;

  apply: any = {
    nom: '', prenom: '', email: '', ville: '', date_naissance: '',
    sexe: '', niveau_etude: null, disponibilite: '', disponibilite_autre: '',
    phone: '', pays: null, experience: null,
    cvChoice: 'upload', lmChoice: 'text', motivation: '', reviewNow: false
  };

  paysOptions = [
    { label: 'Burkina Faso', value: 'BF', code: 'BF', flag: 'https://flagcdn.com/w20/bf.png' },
    { label: 'Côte d\'Ivoire', value: 'CI', code: 'CI', flag: 'https://flagcdn.com/w20/ci.png' },
    { label: 'Mali', value: 'ML', code: 'ML', flag: 'https://flagcdn.com/w20/ml.png' },
  ];
  
  niveauEtudeOptions = [
    { label: 'CAP / BEP', value: 'cap_bep' },
    { label: 'BAC', value: 'bac' },
    { label: 'BAC+2', value: 'bac+2' },
    { label: 'BAC+3', value: 'bac+3' },
    { label: 'BAC+5 et plus', value: 'bac+5' }
  ];

  constructor(
    private api: OffreService,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private profileService: ProfileService,
    private ar: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    console.log('%c🏗️ CONSTRUCTION', 'background: #222; color: #bada55; font-size: 16px; padding: 4px;');
  }

  private linksPatched = false;

  ngOnInit(): void {
  this.detectAuthentication();
  
  this.loadOffres();

  this.ar.paramMap.subscribe(pm => {
    this.routeOfferId = pm.get('id');
    this.tryOpenOfferFromRoute();
  });
  
}

  // ✅ MODIFIÉ — Force target="_blank" sur tous les liens
getSafeHtml(html: string): SafeHtml {
  if (!html) return this.sanitizer.bypassSecurityTrustHtml('');

  // Forcer target="_blank" sur tous les liens qui ne l'ont pas encore
  const processed = html.replace(
    /<a(?![^>]*target=)([^>]*href=)/gi,
    '<a target="_blank" rel="noopener noreferrer"$1'
  );

  return this.sanitizer.bypassSecurityTrustHtml(processed);
}

// ✅ NOUVEAU — Clic sur un lien dans le contenu HTML → ouvre dans un nouvel onglet
// ✅ VERSION ROBUSTE — Gestion des clics sur les liens
onContentLinkClick(event: MouseEvent): void {
  // Cherche le lien depuis la cible du clic
  let el = event.target as HTMLElement | null;

  // Remonte jusqu'à trouver un <a> (max 5 niveaux)
  let depth = 0;
  while (el && depth < 5) {
    if (el.tagName?.toLowerCase() === 'a') {
      const href = (el as HTMLAnchorElement).getAttribute('href')
                || (el as HTMLAnchorElement).href;
      if (href) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    el = el.parentElement;
    depth++;
  }
}
  private detectAuthentication(): void {
    console.log('%c🔍 DÉTECTION AUTHENTIFICATION', 'background: purple; color: white; font-size: 14px; padding: 4px;');
    
    this.isAuth = this.authService.isAuthenticated();
    console.log('1️⃣ isAuth:', this.isAuth);
    
    if (!this.isAuth) {
      console.log('%c❌ PAS AUTHENTIFIÉ', 'background: red; color: white;');
      return;
    }

    this.userRole = (this.authService.getCurrentUserRole() || '').toLowerCase().trim();
    this.isCandidat = this.userRole === 'candidat';
    
    console.log('2️⃣ userRole:', this.userRole);
    console.log('3️⃣ isCandidat:', this.isCandidat);

    if (this.isCandidat) {
      console.log('%c✅ EST CANDIDAT → Chargement profil', 'background: green; color: white;');
      this.loadCandidatProfile();
    } else {
      console.log('%c⚠️ PAS CANDIDAT', 'background: orange; color: white;');
    }
  }

  private loadCandidatProfile(): void {
    console.log('%c📥 CHARGEMENT PROFIL', 'background: teal; color: white; font-size: 14px; padding: 4px;');
    
    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('%c✅ SUCCÈS API', 'background: green; color: white; font-size: 14px;');
        console.log('Réponse complète:', response);
        
        const profile = response?.data ?? response;
        this.candidatProfile = profile;
        this.profileLoaded = true; // ✅ Marquer comme chargé
        
        console.log('Profile stocké:', {
          hasUser: !!profile.user,
          hasCandidat: !!profile.candidat,
          user: profile.user,
          candidat: profile.candidat
        });
      },
      error: (err) => {
        console.log('%c❌ ERREUR API', 'background: red; color: white; font-size: 14px;');
        console.error('Détails:', err);
        this.profileLoaded = true; // Marquer comme "terminé" même en erreur
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger votre profil',
          life: 3000
        });
      }
    });
  }

private loadOffres(): void {
  this.fetchAllPages(1, []);
}

private fetchAllPages(page: number, accumulated: Offre[]): void {
  this.api.getAdminOffres(page, 100).subscribe({
    next: (response: any) => {
      let rows: Offre[] = [];
      let lastPage = 1;

      if (Array.isArray(response)) {
        rows = response;
      } else if (Array.isArray(response?.data)) {
        rows = response.data;
      } else if (response?.data?.data) {
        rows = response.data.data;
        lastPage = response.data.last_page ?? 1;
      }

      const enriched = rows
        .map(enrichOffreForUi)
        .filter((o: Offre) => o.statut === 'publiee' && !o.isExpired)
        .map((o: Offre) => ({
          ...o,
          _plainDescription: this.decodeHtml(o.description || '')
        }));

      const allSoFar = [...accumulated, ...enriched];

      // ✅ Afficher immédiatement ce qu'on a déjà
      this.all.set(allSoFar);
      this.tryOpenOfferFromRoute();

      if (page < lastPage) {
        // ✅ Continuer à charger en arrière-plan
        this.fetchAllPages(page + 1, allSoFar);
      }
    },
    error: () => {
      if (accumulated.length > 0) {
        this.all.set(accumulated);
      } else {
        this.all.set([]);
      }
    }
  });
}

  /**
   * ✅ POSTULER - Avec pré-remplissage forcé
   */
  postuler(o: Offre) {
    console.log('%c📝 === POSTULER APPELÉ ===', 'background: blue; color: white; font-size: 16px; padding: 8px;');
    console.log('Offre:', o.titre);
    
    this.selectedOffre = o;
    
    // Reset du formulaire
    this.apply = {
      nom: '', prenom: '', email: '', ville: '', date_naissance: '',
      sexe: '', niveau_etude: null, disponibilite: '', disponibilite_autre: '',
      phone: '', pays: null, experience: null,
      cvChoice: 'upload', lmChoice: 'text', motivation: '', reviewNow: false
    };
    
    console.log('État actuel:');
    console.log('  - isAuth:', this.isAuth);
    console.log('  - isCandidat:', this.isCandidat);
    console.log('  - profileLoaded:', this.profileLoaded);
    console.log('  - candidatProfile:', this.candidatProfile);
    
    // ✅ Si candidat ET profil disponible
    if (this.isAuth && this.isCandidat && this.candidatProfile) {
      console.log('%c🔄 PRÉ-REMPLISSAGE', 'background: green; color: white; font-size: 14px;');
      
      this.preFillForm();
      
    } else if (this.isAuth && this.isCandidat && !this.profileLoaded) {
      // ✅ Si le profil n'est pas encore chargé, attendre un peu
      console.log('%c⏳ ATTENTE PROFIL...', 'background: orange; color: white;');
      
      this.messageService.add({
        severity: 'info',
        summary: 'Chargement',
        detail: 'Chargement de vos informations...',
        life: 2000
      });
      
      // Réessayer après 1 seconde
      setTimeout(() => {
        if (this.candidatProfile) {
          console.log('✅ Profil maintenant disponible, pré-remplissage...');
          this.preFillForm();
        } else {
          console.warn('⚠️ Profil toujours indisponible après délai');
        }
      }, 1000);
    } else {
      console.log('%c⚠️ PAS DE PRÉ-REMPLISSAGE', 'background: orange; color: white;');
      console.log('Raisons:', {
        isAuth: this.isAuth,
        isCandidat: this.isCandidat,
        hasProfile: !!this.candidatProfile
      });
    }
    
    this.applyVisible = true;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Pré-remplir le formulaire
   */
  private preFillForm(): void {
    console.log('%c🎨 DÉBUT PRÉ-REMPLISSAGE', 'background: purple; color: white; font-weight: bold;');
    
    const user = this.candidatProfile.user;
    const candidat = this.candidatProfile.candidat;
    
    console.log('Données disponibles:', { user, candidat });
    
    if (user) {
      console.log('📝 Remplissage USER:');
      
      this.apply.nom = user.nom || '';
      console.log('  ✓ nom:', this.apply.nom);
      
      this.apply.prenom = user.prenom || '';
      console.log('  ✓ prenom:', this.apply.prenom);
      
      this.apply.email = user.email || '';
      console.log('  ✓ email:', this.apply.email);
      
      this.apply.phone = user.telephone || '';
      console.log('  ✓ phone:', this.apply.phone);
    }
    
    if (candidat) {
      console.log('📝 Remplissage CANDIDAT:');
      
      this.apply.ville = candidat.ville || '';
      console.log('  ✓ ville:', this.apply.ville);
      
      this.apply.sexe = candidat.sexe || '';
      this.apply.niveau_etude = candidat.niveau_etude || null;
      this.apply.disponibilite = candidat.disponibilite || '';
      this.apply.experience = candidat.experience || null;
      
      if (candidat.date_naissance) {
        try {
          this.apply.date_naissance = new Date(candidat.date_naissance).toISOString().slice(0, 10);
          console.log('  ✓ date_naissance:', this.apply.date_naissance);
        } catch (e) {
          console.warn('  ⚠️ Erreur date:', e);
        }
      }
      
      if (candidat.pays_id) {
        const pays = this.paysOptions.find(p => p.value === candidat.pays_id || p.code === candidat.pays_id);
        if (pays) {
          this.apply.pays = pays.value;
          console.log('  ✓ pays:', this.apply.pays);
        }
      }
      
      if (candidat.cv) {
        this.apply.cvChoice = 'existing';
        console.log('  ✓ CV existant');
      }
    }
    
    console.log('%c✅ FIN PRÉ-REMPLISSAGE', 'background: purple; color: white; font-weight: bold;');
    console.log('État final apply:', this.apply);
    
    // ✅ Forcer la détection de changement Angular
    setTimeout(() => {
      console.log('🔄 Force change detection');
    }, 0);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Pré-remplissage réussi',
      detail: `${this.apply.prenom} ${this.apply.nom}`,
      life: 3000
    });
  }

  // Helpers
  private decodeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = (html || '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
    return (div.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private normalize(str: string): string {
    return (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
  }

  plain(html: string): string { return this.decodeHtml(html); }
  filtered(): Offre[] {
    const qn = this.normalize(this.q);
    if (!qn) return this.all();
    return this.all().filter((o: any) => {
      const t = this.normalize(o.titre || '');
      const e = this.normalize(o.entreprise?.nom_entreprise || '');
      const l = this.normalize(o.localisation || '');
      const d = this.normalize((o as any)._plainDescription || '');
      return t.includes(qn) || e.includes(qn) || l.includes(qn) || d.includes(qn);
    });
  }
  total(): number { return this.filtered().length; }
  pageRows(): Offre[] {
    const start = this.page * this.rows;
    return this.filtered().slice(start, start + this.rows);
  }
  onPage(e: any) { this.page = e.page; this.rows = e.rows; }
  clear() { this.q = ''; this.page = 0; }
  isFeatured(o: Offre): boolean {
    const level = Number((o as any).sponsored_level ?? 0);
    if (level <= 0) return false;
    const fu = (o as any).featured_until;
    if (!fu) return true;
    const end = fu instanceof Date ? fu.getTime() : new Date(fu).getTime();
    return !isNaN(end) ? end > Date.now() : true;
  }
  openOffreDetails(o: Offre) {
    this.selectedOffre = o;
    this.selectedOffreSafeHtml = this.buildSafeHtml(o.description || ''); // ✅
    this.detailsVisible = true;
  }

  buildSafeHtml(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    const processed = html
      .replace(/<a(?![^>]*target=)([^>]*href=)/gi,
        '<a target="_blank" rel="noopener noreferrer"$1')
      .replace(/<a /gi,
        '<a style="color:#111d9d;text-decoration:underline;cursor:pointer;" ');
    return this.sanitizer.bypassSecurityTrustHtml(processed);
  }
  goToJob(id: number) { this.router.navigate(['/offres', id]); }
  onApplyFile(e: Event) { this.cvFile = (e.target as HTMLInputElement).files?.[0] || null; }
  onApplyLmFile(e: Event) { this.lmFile = (e.target as HTMLInputElement).files?.[0] || null; }
  goLogin() {
    this.applyVisible = false;
    this.router.navigate(['/connexion'], { queryParams: { redirect: this.router.url } });
  }
  submitApplication(form: any) {
    if (form.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Formulaire invalide', life: 3000 });
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Envoyée', detail: 'Candidature envoyée !', life: 3000 });
    this.applyVisible = false;
    this.cvFile = null;
    this.lmFile = null;
  }

  getShortOffreLink(o: any): string {
  if (!o?.id) return window.location.origin;

  const title = String(o.titre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${window.location.origin}/o/${o.id}-${title}`;
}

copyShortLink(o: any) {
  const link = this.getShortOffreLink(o);

  navigator.clipboard.writeText(link).then(() => {
    this.messageService.add({
      severity: 'success',
      summary: 'Copié',
      detail: 'Lien de l’offre copié',
      life: 2000
    });
  }).catch(() => {
    // fallback si clipboard bloqué
    const input = document.createElement('input');
    input.value = link;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);

    this.messageService.add({
      severity: 'success',
      summary: 'Copié',
      detail: 'Lien de l’offre copié',
      life: 2000
    });
  });
}

private tryOpenOfferFromRoute(): void {
  const id = this.routeOfferId;
  if (!id) return;

  // si la liste n'est pas encore chargée
  const list = this.all();
  if (!list?.length) return;

  // on cherche dans la liste complète (pas filtered() car q peut filtrer)
  const offer = list.find(o => String(o.id) === String(id));
  if (!offer) return;

  // ✅ pour être sûr qu’elle soit visible: on enlève le filtre et on calcule la page
  this.q = '';
  const idx = list.findIndex(o => String(o.id) === String(id));
  if (idx >= 0) this.page = Math.floor(idx / this.rows);

  // highlight + scroll
  this.highlightId = Number(id);

  setTimeout(() => {
    document.getElementById('offer-' + id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // ✅ ouvre automatiquement le "Voir plus"
    this.openOffreDetails(offer);

    // option: enlever le highlight après 6s
    setTimeout(() => (this.highlightId = null), 6000);
  }, 150);
}

// ✅ Découpe les offres en groupes de 6 (2 lignes × 3 colonnes)
chunks(): Offre[][] {
  const rows = this.pageRows();
  const result: Offre[][] = [];
  for (let i = 0; i < rows.length; i += 6) {
    result.push(rows.slice(i, i + 6));
  }
  return result;
}

// ✅ Rotation des bannières selon l'index du groupe
getBannerSrc(index: number): string {
  const banners = [
    'assets/images/AJ COVER_Plan de travail 1.jpeg',
    'assets/images/BANDE I_Plan de travail 1.jpeg',
    'assets/images/BANDE II_Plan de travail 1.jpeg',
    'assets/images/BANDE III_Plan de travail 1.jpeg',
    
  ];
  return banners[index % banners.length];
}

// ✅ NOUVEAU — Attache les event listeners directement sur les <a>
  private patchLinks(): void {
    const container = document.querySelector('.offer-content-html');
    if (!container) return;

    const links = container.querySelectorAll('a[href]');
    if (links.length === 0) return;

    links.forEach(link => {
      // Évite de doubler les listeners
      if ((link as any).__patched) return;
      (link as any).__patched = true;

      link.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const href = (link as HTMLAnchorElement).getAttribute('href') || '';
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
      });
    });

    this.linksPatched = true;
  }
}