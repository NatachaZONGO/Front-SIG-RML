import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TopbarWidget } from './components/topbarwidget.component';
import { Accueil } from './components/accueil';

import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { DividerModule } from 'primeng/divider';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { FormsModule, NgForm } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

// === Services + modèles ===
import { OffreService } from '../crud/offre/offre.service';
import { Offre, enrichOffreForUi } from '../crud/offre/offre.model';
import { Publiciteservice } from '../crud/publicite/publicite.service';
import { Publicite } from '../crud/publicite/publicite.model';
import { ConseilService } from '../crud/conseil/conseil.service';
import { Conseil } from '../crud/conseil/conseil.model';

import { CandidatureService } from '../crud/candidature/candidature.service';
import { User } from '../crud/user/user.model';
import { Pays } from '../crud/pays/pays.model';
import { PaysService } from '../crud/pays/pays.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendURL } from '../../Share/const';
import { OffreCreateDialogComponent } from "../crud/offre/offre-create-dialog.component";
import { OffresListComponent } from './components/offres_list/offres-list.component';


type CountryOption = { label: string; value: string; flag?: string; code: string };

type Offer = {
  id: number;
  titre: string;
  entreprise: string;
  ville: string;
  type: string;
  resume: string;
  publie_le: Date;
};

type Ad = {
  id: number;
  titre: string;
  description?: string;
  image?: string;
  video?: string;
  lien?: string;
};

type Tip = {
  id: number;
  titre: string;
  extrait: string;
  categorie?: string;
  niveau?: string;
  publie_le?: Date | null;
};

type LMChoice = 'upload' | 'text' | 'none';

@Component({
  selector: 'app-landing',
  standalone: true,
  providers: [
    OffreService,
    MessageService,
    Publiciteservice,
    ConseilService,
    ConfirmationService,
    CandidatureService
  ],
  imports: [
    CommonModule, RouterModule,
    TopbarWidget, Accueil,
    ButtonModule, RippleModule,
    StyleClassModule, DividerModule,
    CarouselModule, TagModule,
    DialogModule, ConfirmDialog,
    ToastModule, FormsModule,
    InputTextModule, TextareaModule,
    InputNumberModule, SelectModule,
    RadioButtonModule, CheckboxModule,
    OffreCreateDialogComponent,
],

  templateUrl: './landing.html',
})
export class Landing implements OnInit {
  
  constructor(
    private router: Router,
    private offreApi: OffreService,
    private pubApi: Publiciteservice,
    private conseilApi: ConseilService,
    private candidatureApi: CandidatureService,
    private messages: MessageService,
    private paysApi: PaysService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  // Carrousel responsive
  adsResponsive = [
    { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
    { breakpoint: '767px',  numVisible: 1, numScroll: 1 }
  ];

  // Détail offre
  detailsVisible = false;
  selectedOffre?: Offre;
  private offresById = new Map<number, Offre>();

  newOffreVisible = false;
  onPublishClicked(){ this.newOffreVisible = true; }
  onOffreSaved(){ this.loadOffres(); }

  onOfferCreated(_o: any) {
    // Recharger tes offres (récentes/vedettes)
    this.loadOffres();
  }
  // Vitrines
  recentOffers: Offer[] = [];
  featuredJobs: Offer[] = [];
  adsRow: Ad[] = [];
  adsCol2: Ad[] = [];
  adsCol4: Ad[] = [];
  tipsRow: Tip[] = [];

  // ====== POSTULER ======
  applyVisible = false;
  isAuth = false;
  currentUser?: User;

  paysOptions: CountryOption[] = [];
  paysLoading = false;

  // Options niveau d’étude
  niveauEtudeOptions = [
    { label: 'Sans diplôme', value: 'Sans diplôme' },
    { label: 'BEPC',         value: 'BEPC' },
    { label: 'BAC',          value: 'BAC' },
    { label: 'Licence',      value: 'Licence' },
    { label: 'Master',       value: 'Master' },
    { label: 'Doctorat',     value: 'Doctorat' },
    { label: 'Autre',        value: 'Autre' },
  ];

// c onseil dialog
  conseilDialogVisible = false;
  loadingConseil = false;
  currentConseil: any | null = null;
  conseilHtml: SafeHtml | null = null;
  conseilSafeHtml: SafeHtml | null = null;

  apply: {
    nom: string; prenom: string; email: string; phone: string;
    pays: string | ''; experience: number | null;
    ville: string; sexe: string; niveau_etude: string;
    cvChoice: 'existing' | 'upload';
    motivation: string; reviewNow: boolean;
    disponibilite: string; disponibilite_autre: string;
    date_naissance: string;
    lmChoice: LMChoice;
  } = {
    nom:'', prenom:'', email:'', phone:'',
    pays:'', experience:0,
    ville:'', sexe:'', niveau_etude:'',
    cvChoice:'upload', motivation:'', reviewNow:true,
    disponibilite: 'immediate',
    disponibilite_autre: '',
    date_naissance: '',
    lmChoice: 'text'
  };

  cvFile: File | null = null;
  lmFile: File | null = null;
  today: string = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.initAuth();
    this.prefillFromUser(this.currentUser);
    this.loadOffres();
    this.loadPublicites();
    this.loadConseils();
    this.loadPays();
  }

  // --- Auth simplified (localStorage: token + me JSON) ---
  private initAuth() {
    this.isAuth = !!localStorage.getItem('token');
    const raw = localStorage.getItem('me');
    if (raw) {
      try { this.currentUser = JSON.parse(raw) as User; }
      catch { this.currentUser = undefined; }
    }
  }
  private prefillFromUser(u?: User) {
    if (!u) return;
    this.apply.nom = u.nom || this.apply.nom;
    this.apply.prenom = u.prenom || this.apply.prenom;
    this.apply.email = u.email || this.apply.email;
    this.apply.phone = u.telephone || this.apply.phone;
  }

  // ---------------- API: Offres publiées ----------------
 private loadOffres(): void {
  this.offreApi.getAdminOffres().subscribe({
    next: (rows: Offre[]) => {
      // enrichissement (dates, flags, names…)
      const enriched: Offre[] = (rows || []).map(enrichOffreForUi);

      // index pour le dialog “Voir plus”
      this.offresById = new Map(
        enriched.filter(x => x?.id != null).map(x => [x.id!, x])
      );

      // seulement PUBLIÉES et NON expirées
      const published = enriched.filter(o => o.statut === 'publiee' && !o.isExpired);

      // split vedettes / normales selon sponsored_level / featured_until
      const featured = published.filter(o => this.isFeaturedOffre(o));
      const normal   = published.filter(o => !this.isFeaturedOffre(o));

      // tri : vedettes -> niveau desc, puis date publication desc
      const featuredSorted = [...featured].sort((a, b) => {
        const lvlA = Number((a as any).sponsored_level ?? 0);
        const lvlB = Number((b as any).sponsored_level ?? 0);
        if (lvlB !== lvlA) return lvlB - lvlA;
        const pa = new Date(a.date_publication as any).getTime() || 0;
        const pb = new Date(b.date_publication as any).getTime() || 0;
        return pb - pa;
      });

      // tri : normales -> date publication desc
      const normalSorted = [...normal].sort((a, b) => {
        const pa = new Date(a.date_publication as any).getTime() || 0;
        const pb = new Date(b.date_publication as any).getTime() || 0;
        return pb - pa;
      });

      // mapping vers les cartes UI
      this.featuredJobs = featuredSorted.slice(0, 6).map(o => this.toOfferView(o));
      this.recentOffers = normalSorted.slice(0, 4).map(o => this.toOfferView(o));
    },
    error: () => {
      this.recentOffers = [];
      this.featuredJobs = [];
    }
  });
}


  // ---------------- API: Publicités actives ----------------
  private loadPublicites(): void {
    this.pubApi.getPublicitesByStatus('active').subscribe({
      next: (rows: Publicite[]) => {
        const now = Date.now();
        const actives = (rows || []).filter(p => {
          const start = p.date_debut ? new Date(p.date_debut).getTime() : -Infinity;
          const end   = p.date_fin   ? new Date(p.date_fin).getTime()   :  Infinity;
          const statusOk = (p.statut || '').toLowerCase() === 'active';
          return statusOk && now >= start && now <= end;
        });

        this.adsRow = actives.map(p => ({
          id: p.id!, titre: p.titre || 'Publicité',
          description: p.description || '',
          image: p.image || undefined,
          video: p.video || undefined,
          lien: p.lien_externe || undefined
        }));
      },
      error: () => { this.adsRow = []; }
    });
  }

  private excerpt(html: string, max = 160): string {
    const txt = this.plain(html);
    return txt.length <= max ? txt : txt.slice(0, max - 1).trimEnd() + '…';
  }

  private loadConseils(): void {
    this.conseilApi.getConseils(1, 12).subscribe({
      next: (res) => {
        const list: Conseil[] = res.content || [];
        const publies = list.filter(c => (c.statut || '').toLowerCase() === 'publie');
        this.tipsRow = publies
          .map<Tip>(c => ({
            id: c.id!, titre: c.titre || 'Conseil',
            extrait: this.excerpt(c.contenu || '', 180),
            categorie: c.categorie || undefined,
            niveau: c.niveau || undefined,
            publie_le: c.date_publication ? new Date(c.date_publication as any) : null
          }))
          .sort((a,b)=> (b.publie_le?.getTime()||0) - (a.publie_le?.getTime()||0))
          .slice(0,6);
      },
      error: () => { this.tipsRow = []; }
    });
  }

  // Navigation

  goAllConseils() { this.router.navigate(['/conseils']); }
  goToJob(id: number) { this.router.navigate(['/offres', id]); }
  goAllJobs() { this.router.navigate(['/offres']); }
  goLogin() { this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } }); }

  // Util pour nettoyer l'HTML
  private plain(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\d+\.\s*/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  openOffreDetails(id: number) {
    const apiOffre = this.offresById.get(id);
    if (apiOffre) { this.selectedOffre = apiOffre; this.detailsVisible = true; }
    else { this.goToJob(id); }
  }

  // ---- POSTULER ----
  postuler(offre: Offre | number) {
    const o = typeof offre === 'number' ? this.offresById.get(offre) : offre;
    if (!o) return;
    this.selectedOffre = o;

    this.initAuth(); // réévalue l’auth
    this.apply = {
      nom: this.currentUser?.nom || '',
      prenom: this.currentUser?.prenom || '',
      email: this.currentUser?.email || '',
      phone: this.currentUser?.telephone || '',
      pays: '',
      experience: 0,
      ville: '',
      sexe: '',
      niveau_etude: '',
      disponibilite: 'immediate',
      disponibilite_autre: '',
      date_naissance: '',
      cvChoice: this.isAuth ? 'existing' : 'upload',
      motivation: '',
      reviewNow: true,
      lmChoice: 'text',
    };

    this.cvFile = null;
    this.lmFile = null;
    this.applyVisible = true;
  }


  // Taille max 5 Mo
private readonly MAX_FILE_BYTES = 5 * 1024 * 1024;

onApplyFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0] ?? null;
  if (f && f.size > this.MAX_FILE_BYTES) {
    this.cvFile = null;
    input.value = '';
    this.messages.add({
      severity: 'warn',
      summary: 'Fichier trop volumineux',
      detail: 'Le CV ne doit pas dépasser 5 Mo.'
    });
    return;
  }
  this.cvFile = f;
}

onApplyLmFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0] ?? null;
  if (f && f.size > this.MAX_FILE_BYTES) {
    this.lmFile = null;
    input.value = '';
    this.messages.add({
      severity: 'warn',
      summary: 'Fichier trop volumineux',
      detail: 'La lettre de motivation ne doit pas dépasser 5 Mo.'
    });
    return;
  }
  this.lmFile = f;
}
  submitApplication(form: NgForm) {
    if (!form.valid || !this.selectedOffre) return;

    const fd = new FormData();
    fd.append('offre_id', String(this.selectedOffre.id));

    // ----- Lettre de motivation (texte OU fichier)
    const lmChoice: LMChoice = this.apply.lmChoice;
    if (lmChoice === 'upload' && this.lmFile) {
      fd.append('lm_source', 'upload');
      fd.append('lettre_motivation_file', this.lmFile);
    } else if (lmChoice === 'text' && this.apply.motivation?.trim()) {
      fd.append('lm_source', 'text');
      fd.append('lettre_motivation', this.apply.motivation.trim());
    } else {
      fd.append('lm_source', 'none');
    }

    // ----- CV
    fd.append('cv_source', this.apply.cvChoice);
    if (this.apply.cvChoice === 'upload' && this.cvFile) {
      fd.append('cv', this.cvFile);
    }

    if (this.isAuth) {
      // ===== Utilisateur connecté =====
      this.candidatureApi.create(fd).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Candidature envoyée' });
          this.applyVisible = false; this.detailsVisible = false;
        },
        error: (e: any) => this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible')
        })
      });
    } else {
      // ===== Invité : champs obligatoires pour le backend =====
      fd.append('nom', this.apply.nom);
      fd.append('prenom', this.apply.prenom);
      fd.append('email', this.apply.email);

      if (this.apply.phone) fd.append('telephone', this.apply.phone);
      if (this.apply.pays)  fd.append('pays_code', (this.apply.pays || '').slice(0, 2).toUpperCase());
      if (this.apply.experience != null) fd.append('experience', String(this.apply.experience));

      // Disponibilité (string seulement)
      const dispo = this.apply.disponibilite === 'autre'
        ? (this.apply.disponibilite_autre?.trim() || 'autre')
        : (this.apply.disponibilite || 'immediate');
      fd.append('disponibilite', dispo);

      // Champs DB attendus
      fd.append('ville', (this.apply.ville || '').trim());
      if (this.apply.sexe)           fd.append('sexe', this.apply.sexe);
      if (this.apply.niveau_etude)   fd.append('niveau_etude', this.apply.niveau_etude);
      if (this.apply.date_naissance) fd.append('date_naissance', this.apply.date_naissance);

      this.candidatureApi.createGuest(fd).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Candidature envoyée' });
          this.applyVisible = false; this.detailsVisible = false;
        },
        error: (e: any) => this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible')
        })
      });
    }
  }

  private loadPays(): void {
    this.paysLoading = true;
    this.paysApi.getPays().subscribe({
      next: (res) => {
        const raw: any[] =
          (Array.isArray(res) && res) ||
          (Array.isArray((res as any)?.data) && (res as any).data) ||
          [];

        const mapFlag = (code?: string, fallback?: string) =>
          fallback || (code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : undefined);

        this.paysOptions = raw
          .map((p: Pays) => {
            const code = (p.code || '').toUpperCase();
            return {
              label: p.nom,
              value: code,
              code,
              flag: mapFlag(p.code, p.flagImage),
            } as CountryOption;
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {
        this.paysOptions = [];
      },
      complete: () => (this.paysLoading = false),
    });
  }

  // ---- Conseil dialog ----
  // Méthode d'ouverture (essaie d’utiliser le contenu déjà chargé, sinon API)
  openConseilDialog(t: any) {
  this.currentConseil = t;
  this.conseilDialogVisible = true;

  // 1) Déjà en HTML ? → passe par buildConseilHtml (décode &nbsp;, corrige listes, etc.)
  const htmlInline = t?.contenu_html ?? t?.html ?? null;
  if (htmlInline) {
  this.conseilSafeHtml = this.sanitizer.bypassSecurityTrustHtml(String(htmlInline));
  return;
}
  // after
  if (htmlInline) {
    this.conseilSafeHtml = this.buildConseilHtml(String(htmlInline));
    return;
  }

  // 2) Markdown/texte → Markdown -> HTML, puis normalisation via buildConseilHtml
  const mdInline = t?.contenu_markdown ?? t?.markdown ?? t?.contenu ?? t?.description ?? t?.texte ?? null;
  if (mdInline) {
    const html = this.markdownToHtml(String(mdInline));
    this.conseilSafeHtml = this.buildConseilHtml(html);
    return;
  }

  // 3) Fetch API → même logique
  if (!t?.id) return;
  this.loadingConseil = true;

  this.http.get<any>(`${BackendURL}conseils/${t.id}`).subscribe({
    next: (res) => {
      const d = res?.data ?? res;
      this.currentConseil = { ...t, ...d };

      const raw =
        d?.contenu_html ??
        d?.html ??
        this.markdownToHtml(
          String(d?.contenu_markdown ?? d?.markdown ?? d?.contenu ?? d?.description ?? d?.texte ?? '')
        );

      this.conseilSafeHtml = this.buildConseilHtml(String(raw));
      this.loadingConseil = false;
    },
    error: () => {
      this.loadingConseil = false;
      this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le conseil.' });
      this.conseilDialogVisible = false;
    }
  });
}

  // L’existant pour ouvrir la page complète reste utile
  goToConseil(id?: number) {
    if (!id) return;
    this.router.navigate(['/conseils', id]);
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';

    const esc = (s: string): string =>
      s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    let s = esc(md);

    // titres # ## ###
    s = s.replace(/^(#{3})\s?(.+)$/gmi, '<h3>$2</h3>');
    s = s.replace(/^(#{2})\s?(.+)$/gmi, '<h2>$2</h2>');
    s = s.replace(/^(#{1})\s?(.+)$/gmi, '<h1>$2</h1>');

    // gras / italique
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // listes numérotées
    s = s.replace(
      /(\n|^)(\d+)\.\s+(.+)(?=(\n\d+\.|\n\n|$))/gms,
      (_m: string, pfx: string, _n: string, block: string): string => {
        const items = block
          .split(/\n\d+\.\s+/)
          .map((it: string) => it.trim())
          .filter((x: string): x is string => Boolean(x));
        return `${pfx}<ol>${items.map((i: string) => `<li>${i}</li>`).join('')}</ol>`;
      }
    );

    // listes à puces
    s = s.replace(
      /(\n|^)[\-\*]\s+(.+)(?=(\n[\-\*]\s+|\n\n|$))/gms,
      (_m: string, pfx: string, block: string): string => {
        const items = block
          .split(/\n[\-\*]\s+/)
          .map((it: string) => it.trim())
          .filter((x: string): x is string => Boolean(x));
        return `${pfx}<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
      }
    );

    // paragraphes
    s = s
      .split(/\n{2,}/)
      .map((par: string) =>
        par.trim().match(/^<h[1-3]|^<ul>|^<ol>/) ? par : `<p>${par}</p>`
      )
      .join('\n');

    // sauts de ligne simples
    s = s.replace(/(?<!>)\n(?!<)/g, '<br/>');

    return s;
  }

  private decodeHtmlEntities(s: string): string {
  const ta = document.createElement('textarea');
  ta.innerHTML = s ?? '';
  return ta.value;
}

buildConseilHtml(raw: string): SafeHtml {
  let s = String(raw ?? '');

  // 1) decode & normalize spaces
  s = this.decodeHtmlEntities(s).replace(/\u00A0/g, ' ').replace(/[ \t]{2,}/g, ' ');

  const hasListTags = /<(ol|ul)\b/i.test(s);

  // 2) If the whole thing is one <p> with inline "1. … 2. …", convert that block into a real <ol>
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m: string, inner: string) => {
    const converted = this.convertInlineList(inner);
    return converted;
  });

  // 3) If there were no <p> tags (pure text or a big blob) and we still see " 1. ",
  //    convert the first inline numbered list into <ol>.
  if (!/<p\b/i.test(s) && !hasListTags && /\b1\.\s+/.test(s)) {
    s = this.convertInlineList(s);
  }

  // 4) If still plain text, wrap paragraphs on double new lines
  if (!/<(p|ol|ul|li|h\d|br)\b/i.test(s)) {
    s = s
      .split(/\n{2,}/)
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
  }

  return this.sanitizer.bypassSecurityTrustHtml(s);
}

/** Turn "Intro … 1. aaa 2. bbb 3. ccc" into "Intro<p/> <ol><li>aaa</li><li>bbb</li><li>ccc</li></ol>" */
private convertInlineList(block: string): string {
  const inner = block.trim();

  // Try numbered first
  let idx = inner.search(/\b\d+\.\s+/);
  if (idx >= 0) {
    const intro = inner.slice(0, idx).trim();
    const listPart = inner.slice(idx);

    const items = listPart
      .split(/\b\d+\.\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (items.length >= 2) {
      const ol = `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
      return intro ? `<p>${intro}</p>${ol}` : ol;
    }
  }

  // Try bullets (-, *, •)
  idx = inner.search(/(?:^|\s)(?:\-|\*|•)\s+/);
  if (idx >= 0) {
    const intro = inner.slice(0, idx).trim();
    const listPart = inner.slice(idx);

    const items = listPart
      .split(/(?:^|\s)(?:\-|\*|•)\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (items.length >= 2) {
      const ul = `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      return intro ? `<p>${intro}</p>${ul}` : ul;
    }
  }

  // Not a list → keep as paragraph
  return `<p>${inner}</p>`;
} 

/** Une offre est "vedette" si sponsored_level > 0 OU featured_until est dans le futur */
private isFeaturedOffre(o: Offre): boolean {
  const lvl = Number((o as any).sponsored_level ?? 0);
  const until = (o as any).featured_until
    ? new Date((o as any).featured_until)
    : null;
  const future = until instanceof Date && !isNaN(until.getTime()) && until > new Date();
  return lvl > 0 || future;
}

/** Mapping API -> carte d’affichage */
private toOfferView(o: Offre): Offer {
  const pub = o.date_publication instanceof Date
    ? o.date_publication
    : new Date(o.date_publication as any);
  return {
    id: o.id!,
    titre: o.titre,
    entreprise: o.entreprise?.nom_entreprise ?? 'Entreprise',
    ville: o.localisation ?? '—',
    type: (o as any).type_contrat ?? '-', // sécurisé
    resume: this.plain(o.description || ''),
    publie_le: isNaN(pub.getTime()) ? new Date() : pub
  };
}

}