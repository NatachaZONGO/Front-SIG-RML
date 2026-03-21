import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core'; // ✅ OnDestroy ajouté
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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

import { OffreService } from '../crud/offre/offre.service';
import { Offre, enrichOffreForUi } from '../crud/offre/offre.model';
import { Publiciteservice } from '../crud/publicite/publicite.service';
import { Publicite } from '../crud/publicite/publicite.model';
import { ConseilService } from '../crud/conseil/conseil.service';
import { Conseil } from '../crud/conseil/conseil.model';
import { CandidatureService } from '../crud/candidature/candidature.service';
import { PaysService } from '../crud/pays/pays.service';
import { Pays } from '../crud/pays/pays.model';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../crud/profil/profil.service';

import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendURL } from '../../Share/const';

import { TopbarWidget } from './components/topbarwidget.component';
import { Accueil } from './components/accueil';
import { OffreCreateDialogComponent } from '../crud/offre/offre-create-dialog.component';
import { FooterWidget } from './components/footerwidget';

type CountryOption = { label: string; value: string; flag?: string; code: string };
type LMChoice = 'upload' | 'text' | 'none';

@Component({
  selector: 'app-landing',
  standalone: true,
  providers: [
    OffreService, MessageService, Publiciteservice, ConseilService,
    ConfirmationService, CandidatureService
  ],
  imports: [
    CommonModule, RouterModule, TopbarWidget, Accueil, ButtonModule, RippleModule,
    StyleClassModule, DividerModule, CarouselModule, TagModule, DialogModule,
    ConfirmDialog, ToastModule, FormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, RadioButtonModule, CheckboxModule,
    OffreCreateDialogComponent, FooterWidget
  ],
  templateUrl: './landing.html',
})
export class Landing implements OnInit, OnDestroy, AfterViewChecked { // ✅ OnDestroy ajouté

  recentOffers: Offre[] = [];
  featuredJobs: Offre[] = [];
  adsRow: Publicite[] = [];
  tipsRow: Conseil[] = [];

  private offresById = new Map<number, Offre>();
  private linksPatched = false;

  adsResponsive = [
    { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
    { breakpoint: '767px',  numVisible: 1, numScroll: 1 }
  ];

  detailsVisible = false;
  selectedOffre?: Offre;
  newOffreVisible = false;
  pubDialogVisible = false;
  currentPub: Publicite | null = null;
  conseilDialogVisible = false;
  loadingConseil = false;
  currentConseil: Conseil | null = null;
  conseilSafeHtml: SafeHtml | null = null;

  selectedOffreSafeHtml: SafeHtml | null = null;

  applyVisible = false;
  isAuth = false;
  userRole = '';
  isCandidat = false;
  candidatProfile: any = null;

  paysOptions: CountryOption[] = [];
  paysLoading = false;

  niveauEtudeOptions = [
    { label: 'Sans diplôme', value: 'Sans diplôme' },
    { label: 'BEPC',         value: 'BEPC' },
    { label: 'BAC',          value: 'BAC' },
    { label: 'Licence',      value: 'Licence' },
    { label: 'Master',       value: 'Master' },
    { label: 'Doctorat',     value: 'Doctorat' },
    { label: 'Autre',        value: 'Autre' },
  ];

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
    nom: '', prenom: '', email: '', phone: '',
    pays: '', experience: 0,
    ville: '', sexe: '', niveau_etude: '',
    cvChoice: 'upload', motivation: '', reviewNow: true,
    disponibilite: 'immediate', disponibilite_autre: '',
    date_naissance: '', lmChoice: 'text'
  };

  cvFile: File | null = null;
  lmFile: File | null = null;
  today: string = new Date().toISOString().slice(0, 10);
  private readonly MAX_FILE_BYTES = 5 * 1024 * 1024;

  // ✅ Handler stocké en propriété pour pouvoir le retirer dans ngOnDestroy
  private readonly linkClickHandler = (e: Event): void => {
  const target = e.target as HTMLElement;
  let el: HTMLElement | null = target;
  for (let i = 0; i < 5; i++) {
    if (!el) break;
    if (el.tagName?.toLowerCase() === 'a') {
      if (el.closest('.offer-content-html')) {
        // ✅ NE PAS preventDefault — laisser le navigateur gérer target="_blank"
        // Juste s'assurer que target est bien défini
        (el as HTMLAnchorElement).target = '_blank';
        (el as HTMLAnchorElement).rel = 'noopener noreferrer';
        // Laisser le clic se propager normalement
        return;
      }
    }
    el = el.parentElement;
  }
};

  constructor(
    public router: Router,
    private offreApi: OffreService,
    private pubApi: Publiciteservice,
    private conseilApi: ConseilService,
    private candidatureApi: CandidatureService,
    private messages: MessageService,
    private paysApi: PaysService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private profileService: ProfileService,
  ) {}

  ngOnInit(): void {
  this.initAuth();
  this.loadOffres();
  this.loadPublicites();
  this.loadConseils();
  this.loadPays();
}

  // ✅ Nettoyage obligatoire
  ngOnDestroy(): void {
    document.removeEventListener('click', this.linkClickHandler, true);
  }

  ngAfterViewChecked(): void {
    if (!this.detailsVisible) {
      this.linksPatched = false;
    }
  }

  // ✅ Force target="_blank" sur tous les liens
  buildSafeHtml(html: string): SafeHtml {
  if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
  const processed = html
    .replace(/<a(?![^>]*target=)([^>]*href=)/gi,
      '<a target="_blank" rel="noopener noreferrer"$1')
    .replace(/<a /gi,
      '<a style="color:#111d9d;text-decoration:underline;cursor:pointer;" ');
  return this.sanitizer.bypassSecurityTrustHtml(processed);
}
  private initAuth(): void {
    this.isAuth = this.authService.isAuthenticated();
    if (!this.isAuth) return;

    this.userRole = (this.authService.getCurrentUserRole() || '').toLowerCase().trim();
    this.isCandidat = this.userRole === 'candidat';

    if (this.isCandidat) {
      this.profileService.getProfile().subscribe({
        next: (response) => {
          this.candidatProfile = response?.data ?? response;
        },
        error: (err) => console.error('❌ Erreur profil (landing):', err)
      });
    }
  }

  private loadOffres(): void {
    this.offreApi.getAdminOffres(1, 100).subscribe({
      next: (response: any) => {
        let rows: Offre[] = [];
        if (Array.isArray(response))            rows = response;
        else if (Array.isArray(response?.data)) rows = response.data;
        else if (response?.data?.data)          rows = response.data.data;

        const allOffres = rows
          .map(enrichOffreForUi)
          .filter(o => o.statut === 'publiee' && !o.isExpired);

        this.offresById = new Map(
          allOffres.filter(x => x?.id != null).map(x => [x.id!, x])
        );

        const featured = allOffres.filter(o => this.isFeaturedOffre(o));
        const normal   = allOffres.filter(o => !this.isFeaturedOffre(o));

        this.featuredJobs = [...featured]
          .sort((a, b) => new Date(b.date_publication as any).getTime() - new Date(a.date_publication as any).getTime())
          .slice(0, 6);

        this.recentOffers = [...normal]
          .sort((a, b) => new Date(b.date_publication as any).getTime() - new Date(a.date_publication as any).getTime())
          .slice(0, 4);
      },
      error: () => { this.recentOffers = []; this.featuredJobs = []; }
    });
  }

  private loadPublicites(): void {
    this.pubApi.getPublicitesByStatus('active').subscribe({
      next: (rows: Publicite[]) => {
        const now = Date.now();
        this.adsRow = (rows || []).filter(p => {
          const start = p.date_debut ? new Date(p.date_debut).getTime() : -Infinity;
          const end   = p.date_fin   ? new Date(p.date_fin).getTime()   : Infinity;
          return (p.statut || '').toLowerCase() === 'active' && now >= start && now <= end;
        });
      },
      error: () => { this.adsRow = []; }
    });
  }

  private loadConseils(): void {
    this.conseilApi.getConseils(1, 12).subscribe({
      next: (res) => {
        const list: Conseil[] = res.content || [];
        this.tipsRow = list
          .filter(c => (c.statut || '').toLowerCase() === 'publie')
          .sort((a, b) => {
            const da = a.date_publication ? new Date(a.date_publication as any).getTime() : 0;
            const db = b.date_publication ? new Date(b.date_publication as any).getTime() : 0;
            return db - da;
          }).slice(0, 6);
      },
      error: () => { this.tipsRow = []; }
    });
  }

  private loadPays(): void {
    this.paysLoading = true;
    this.paysApi.getPays().subscribe({
      next: (res) => {
        const raw: any[] =
          (Array.isArray(res) && res) ||
          (Array.isArray((res as any)?.data) && (res as any).data) || [];

        const mapFlag = (code?: string, fallback?: string) =>
          fallback || (code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : undefined);

        this.paysOptions = raw
          .map((p: Pays) => {
            const code = (p.code || '').toUpperCase();
            return { label: p.nom, value: code, code, flag: mapFlag(p.code, p.flagImage) } as CountryOption;
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => { this.paysOptions = []; },
      complete: () => (this.paysLoading = false),
    });
  }

  public isFeaturedOffre(o: Offre): boolean {
    const lvl   = Number((o as any).sponsored_level ?? 0);
    const until = (o as any).featured_until ? new Date((o as any).featured_until) : null;
    const future = until instanceof Date && !isNaN(until.getTime()) && until > new Date();
    return lvl > 0 || future;
  }

  excerpt(html: string, max = 160): string {
    const txt = this.plain(html);
    return txt.length <= max ? txt : txt.slice(0, max - 1).trimEnd() + '…';
  }

  plain(html: string): string { return this.decodeHtml(html); }

  private decodeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = (html || '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
    return (div.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  goAllConseils() { this.router.navigate(['/conseils']); }
  goToJob(id: number) { this.router.navigate(['/offres', id]); }
  goAllJobs() { this.router.navigate(['/offres']); }
  goLogin() {
    this.applyVisible = false;
    this.router.navigate(['/connexion'], { queryParams: { returnUrl: this.router.url } });
  }

  openOffreDetails(id: number) {
  const apiOffre = this.offresById.get(id);
  if (apiOffre) {
    this.selectedOffre = apiOffre;
    // ✅ Calculé UNE SEULE FOIS, pas à chaque change detection
    this.selectedOffreSafeHtml = this.buildSafeHtml(apiOffre.description || '');
    this.detailsVisible = true;
  } else {
    this.goToJob(id);
  }
}

  onPublishClicked() { this.newOffreVisible = true; }
  onOffreSaved() { this.loadOffres(); }
  onOfferCreated(_o: any) { this.loadOffres(); }

  openPubDialog(pub: Publicite): void {
    this.currentPub = pub;
    this.pubDialogVisible = true;
  }

  openConseilDialog(t: Conseil) {
    this.currentConseil = t;
    this.conseilDialogVisible = true;

    const htmlInline = (t as any)?.contenu_html ?? (t as any)?.html ?? null;
    if (htmlInline) { this.conseilSafeHtml = this.buildConseilHtml(String(htmlInline)); return; }

    const mdInline = (t as any)?.contenu_markdown ?? (t as any)?.markdown ?? t?.contenu ?? null;
    if (mdInline) { this.conseilSafeHtml = this.buildConseilHtml(this.markdownToHtml(String(mdInline))); return; }

    if (!t?.id) return;

    this.loadingConseil = true;
    this.http.get<any>(`${BackendURL}conseils/${t.id}`).subscribe({
      next: (res) => {
        const d = res?.data ?? res;
        this.currentConseil = { ...t, ...d };
        const raw = d?.contenu_html ?? d?.html ?? this.markdownToHtml(String(d?.contenu_markdown ?? d?.markdown ?? d?.contenu ?? ''));
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

  goToConseil(id?: number) {
    if (!id) return;
    this.router.navigate(['/conseils', id]);
  }

  postuler(offre: Offre | number) {
    const o = typeof offre === 'number' ? this.offresById.get(offre) : offre;
    if (!o) return;

    this.selectedOffre = o;
    this.apply = {
      nom: '', prenom: '', email: '', phone: '',
      pays: '', experience: 0,
      ville: '', sexe: '', niveau_etude: '',
      disponibilite: 'immediate', disponibilite_autre: '',
      date_naissance: '',
      cvChoice: this.isAuth ? 'existing' : 'upload',
      motivation: '', reviewNow: true, lmChoice: 'text',
    };
    this.cvFile = null;
    this.lmFile = null;

    if (this.isAuth && this.isCandidat && this.candidatProfile) {
      const user     = this.candidatProfile.user;
      const candidat = this.candidatProfile.candidat;
      if (user) {
        this.apply.nom    = user.nom       || '';
        this.apply.prenom = user.prenom    || '';
        this.apply.email  = user.email     || '';
        this.apply.phone  = user.telephone || '';
      }
      if (candidat) {
        this.apply.ville         = candidat.ville         || '';
        this.apply.sexe          = candidat.sexe          || '';
        this.apply.niveau_etude  = candidat.niveau_etude  || '';
        this.apply.disponibilite = candidat.disponibilite || 'immediate';
        this.apply.experience    = candidat.experience    || 0;
        if (candidat.date_naissance) {
          try { this.apply.date_naissance = new Date(candidat.date_naissance).toISOString().slice(0, 10); } catch (e) {}
        }
        if (candidat.pays_id) this.apply.pays = candidat.pays_id;
        if (candidat.cv)      this.apply.cvChoice = 'existing';
      }
      this.messages.add({ severity: 'success', summary: 'Pré-remplissage', detail: `Données chargées : ${this.apply.prenom} ${this.apply.nom}`, life: 3000 });
    }

    this.applyVisible = true;
  }

  onApplyFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f && f.size > this.MAX_FILE_BYTES) {
      this.cvFile = null; input.value = '';
      this.messages.add({ severity: 'warn', summary: 'Fichier trop volumineux', detail: 'Le CV ne doit pas dépasser 5 Mo.' });
      return;
    }
    this.cvFile = f;
  }

  onApplyLmFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f && f.size > this.MAX_FILE_BYTES) {
      this.lmFile = null; input.value = '';
      this.messages.add({ severity: 'warn', summary: 'Fichier trop volumineux', detail: 'La lettre de motivation ne doit pas dépasser 5 Mo.' });
      return;
    }
    this.lmFile = f;
  }

  submitApplication(form: NgForm) {
    if (!form.valid || !this.selectedOffre) return;

    const fd = new FormData();
    fd.append('offre_id', String(this.selectedOffre.id));

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

    fd.append('cv_source', this.apply.cvChoice);
    if (this.apply.cvChoice === 'upload' && this.cvFile) fd.append('cv', this.cvFile);

    if (this.isAuth) {
      this.candidatureApi.create(fd).subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Candidature envoyée' }); this.applyVisible = false; this.detailsVisible = false; },
        error: (e: any) => this.messages.add({ severity: 'error', summary: 'Erreur', detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible') })
      });
    } else {
      fd.append('nom',    this.apply.nom);
      fd.append('prenom', this.apply.prenom);
      fd.append('email',  this.apply.email);
      if (this.apply.phone)        fd.append('telephone',    this.apply.phone);
      if (this.apply.pays)         fd.append('pays_code',    (this.apply.pays || '').slice(0, 2).toUpperCase());
      if (this.apply.experience != null) fd.append('experience', String(this.apply.experience));
      const dispo = this.apply.disponibilite === 'autre'
        ? (this.apply.disponibilite_autre?.trim() || 'autre')
        : (this.apply.disponibilite || 'immediate');
      fd.append('disponibilite', dispo);
      fd.append('ville', (this.apply.ville || '').trim());
      if (this.apply.sexe)          fd.append('sexe',          this.apply.sexe);
      if (this.apply.niveau_etude)  fd.append('niveau_etude',  this.apply.niveau_etude);
      if (this.apply.date_naissance) fd.append('date_naissance', this.apply.date_naissance);

      this.candidatureApi.createGuest(fd).subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Candidature envoyée' }); this.applyVisible = false; this.detailsVisible = false; },
        error: (e: any) => this.messages.add({ severity: 'error', summary: 'Erreur', detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible') })
      });
    }
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';
    const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let s = esc(md);
    s = s.replace(/^(#{3})\s?(.+)$/gmi, '<h3>$2</h3>');
    s = s.replace(/^(#{2})\s?(.+)$/gmi, '<h2>$2</h2>');
    s = s.replace(/^(#{1})\s?(.+)$/gmi, '<h1>$2</h1>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/(\n|^)(\d+)\.\s+(.+)(?=(\n\d+\.|\n\n|$))/gms, (_m: string, pfx: string, _n: string, block: string): string => {
      const items = block.split(/\n\d+\.\s+/).map((it: string) => it.trim()).filter((x: string): x is string => Boolean(x));
      return `${pfx}<ol>${items.map((i: string) => `<li>${i}</li>`).join('')}</ol>`;
    });
    s = s.replace(/(\n|^)[\-\*]\s+(.+)(?=(\n[\-\*]\s+|\n\n|$))/gms, (_m: string, pfx: string, block: string): string => {
      const items = block.split(/\n[\-\*]\s+/).map((it: string) => it.trim()).filter((x: string): x is string => Boolean(x));
      return `${pfx}<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
    });
    s = s.split(/\n{2,}/).map((par: string) => par.trim().match(/^<h[1-3]|^<ul>|^<ol>/) ? par : `<p>${par}</p>`).join('\n');
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
    s = this.decodeHtmlEntities(s).replace(/\u00A0/g, ' ').replace(/[ \t]{2,}/g, ' ');
    const hasListTags = /<(ol|ul)\b/i.test(s);
    s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m: string, inner: string) => this.convertInlineList(inner));
    if (!/<p\b/i.test(s) && !hasListTags && /\b1\.\s+/.test(s)) s = this.convertInlineList(s);
    if (!/<(p|ol|ul|li|h\d|br)\b/i.test(s)) {
      s = s.split(/\n{2,}/).map(p => `<p>${p.trim()}</p>`).join('');
    }
    return this.sanitizer.bypassSecurityTrustHtml(s);
  }

  private convertInlineList(block: string): string {
    const inner = block.trim();
    let idx = inner.search(/\b\d+\.\s+/);
    if (idx >= 0) {
      const intro = inner.slice(0, idx).trim();
      const items = inner.slice(idx).split(/\b\d+\.\s+/).map(x => x.trim()).filter(Boolean);
      if (items.length >= 2) {
        const ol = `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
        return intro ? `<p>${intro}</p>${ol}` : ol;
      }
    }
    idx = inner.search(/(?:^|\s)(?:\-|\*|•)\s+/);
    if (idx >= 0) {
      const intro = inner.slice(0, idx).trim();
      const items = inner.slice(idx).split(/(?:^|\s)(?:\-|\*|•)\s+/).map(x => x.trim()).filter(Boolean);
      if (items.length >= 2) {
        const ul = `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
        return intro ? `<p>${intro}</p>${ul}` : ul;
      }
    }
    return `<p>${inner}</p>`;
  }

  copyShortLink(o: Offre) {
    if (!o?.id) { this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de copier le lien', life: 3000 }); return; }
    const link = this.getShortOffreLink(o);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link)
        .then(() => this.messages.add({ severity: 'success', summary: '✓ Lien copié', detail: 'Le lien a été copié dans le presse-papier', life: 3000 }))
        .catch(() => this.fallbackCopyLink(link));
    } else {
      this.fallbackCopyLink(link);
    }
  }

  private getShortOffreLink(o: Offre): string {
    if (!o?.id) return window.location.origin;
    const title = String(o.titre || '')
      .toLowerCase().normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${window.location.origin}/o/${o.id}-${title}`;
  }

  private fallbackCopyLink(link: string): void {
    const input = document.createElement('input');
    input.value = link;
    input.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      this.messages.add({ severity: 'success', summary: '✓ Lien copié', detail: 'Le lien a été copié dans le presse-papier', life: 3000 });
    } catch {
      this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de copier le lien', life: 3000 });
    } finally {
      document.body.removeChild(input);
    }
  }

  // ✅ Gestionnaire simple — force target="_blank" sans bloquer le comportement par défaut
handleOfferContentClick(event: MouseEvent): void {
  let el = event.target as HTMLElement | null;
  for (let i = 0; i < 5; i++) {
    if (!el) break;
    if (el.tagName?.toLowerCase() === 'a') {
      const a = el as HTMLAnchorElement;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      // ✅ PAS de preventDefault — le navigateur suit le lien normalement
      return;
    }
    el = el.parentElement;
  }
}
}