import { Component, OnDestroy, OnInit, ViewChild, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Candidature } from './candidature.model';
import { CandidatureService } from './candidature.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RouterModule } from '@angular/router';
import { BackendURL } from '../../../Share/const';
import { TextareaModule } from 'primeng/textarea';
import { CanSeeDirective } from '../../../Share/can_see/can_see.directive';

interface Column { field: string; header: string; }

@Component({
  selector: 'app-candidature',
  standalone: true,
  templateUrl: './candidature.component.html',
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    TableModule,
    ToolbarModule,
    ToastModule,
    ProgressBarModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    ConfirmDialogModule,
    InputIconModule,
    IconFieldModule,
    RouterModule,
    TextareaModule,
    CanSeeDirective
  ],
  providers: [MessageService, ConfirmationService]
})
export class CandidaturesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI
  loading = signal(false);
  @ViewChild('dt') dt!: Table;

  // Data
  candidatures = signal<Candidature[]>([]);
  offresOptions: { label: string; value: number }[] = [];
  selectedOffreId: number | null = null;

  // Table
  cols: Column[] = [
    { field: 'fullName', header: 'Candidat' },
    { field: 'email', header: 'Email' },
    { field: 'telephone', header: 'Téléphone' },
    { field: 'offre', header: 'Offre' },
    { field: 'created_at', header: 'Soumise le' },
    { field: 'statut', header: 'Statut' }
  ];

  statutOptions = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'Acceptée', value: 'acceptee' },
    { label: 'Refusée', value: 'refusee' }
  ];

  // Détail
  detailDialog = false;
  current!: any; // mapForView enrichit l’objet
  modifyDialog = false;
  currentToModify?: any;
  nouveauStatut?: string;
  motifRefus = '';

  constructor(
    private candService: CandidatureService,
    private message: MessageService,
    private confirmationService: ConfirmationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadOffresAndData();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ---------- Load ----------
 private loadOffresAndData(): void {
  this.loading.set(true);

  this.candService.getOffresLight()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (offres: any) => {
        const offresList = Array.isArray(offres) ? offres : (offres?.data || []);
        this.offresOptions = offresList.map((o: any) => ({ label: o.titre, value: o.id }));
        this.loadCandidatures(); // charge ensuite
      },
      error: () => {
        this.loadCandidatures(); // essaie quand même
      }
    });
}



  loadCandidatures(): void {
  this.loading.set(true);

  const source$ = this.selectedOffreId
    ? this.candService.getByOffre(this.selectedOffreId)
    : this.candService.getCandidaturesByRole(); // <- renvoie Observable<any[]>

  source$
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: (rows: any[]) => {
        // rows est déjà un tableau
        this.candidatures.set(this.mapForView(rows));
      },
      error: (e) => {
        console.error('loadCandidatures error:', e);
        const msg =
          e?.status === 401 ? 'Non authentifié (merci de vous reconnecter)' :
          e?.status === 403 ? 'Accès refusé' :
          'Erreur lors du chargement des candidatures';
        this.toastError(msg);
        this.candidatures.set([]);
      }
    });
}




  // Helper: garantit un URL absolu vers /api/candidatures/{id}/download/{type}
private buildApiDownload(id: number, type: 'cv' | 'lm'): string {
  // BackendURL doit pointer vers l’API, ex: http://127.0.0.1:8000/api/
  // On normalise un éventuel trailing slash.
  const base = BackendURL.endsWith('/') ? BackendURL.slice(0, -1) : BackendURL;
  return `${base}/candidatures/${id}/download/${type}`;
}

private api(path: string): string {
  const base = String(BackendURL).replace(/\/+$/,'');           // enlève les / en trop en fin
  const p = String(path).replace(/^\/+/, '');                   // enlève les / en trop en début
  return `${base}/${p}`;
}
// Normalise une URL potentiellement "storage/..." renvoyée par l'API
private normalizeFileUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  const p = String(pathOrUrl);
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  // si l’API renvoie "storage/...."
  if (p.startsWith('storage/')) {
    const base = BackendURL.endsWith('/') ? BackendURL : BackendURL + '/';
    return `${base}${p}`;
  }
  // sinon on suppose que c’est un chemin relatif vers disque public
  const base = BackendURL.endsWith('/') ? BackendURL : BackendURL + '/';
  return `${base}storage/${p}`;
}

private mapForView(list: Candidature[]): any[] {
  return list.map((c: any) => {
    const id = c.id as number;

    // URLs renvoyées par l'API (si déjà présentes)
    const apiCvUrl = c.cv_url as string | null;
    const apiLmUrl = c.lm_url as string | null;

    // Indices qu'un fichier LM existe (colonne dédiée ou fallback "[file] path")
    const lmText: string = c.lettre_motivation || '';
    const hasLmFileByText = lmText.startsWith('[file] ');
    const hasLmFileByColumn = !!c.lettre_motivation_fichier;

    // Construit des liens vers les routes API de download
    const cv_dl =
      apiCvUrl ??
      (id && c.cv ? this.api(`candidatures/${id}/download/cv`) : null);

    const lm_dl =
      apiLmUrl ??
      (id && (hasLmFileByColumn || hasLmFileByText)
        ? this.api(`candidatures/${id}/download/lm`)
        : null);

    // Si fichier LM => on masque le texte
    const motivationText = lm_dl ? '' : lmText;

    return {
      ...c,
      fullName: this.getFullName(c),
      email: this.getEmail(c),
      telephone: this.getTelephone(c),
      offreTitre: c.offre?.titre ?? '—',
      created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—',
      motivationText,
      cv_dl,
      lm_dl
    };
  });
}



  // Ouvre dans un nouvel onglet
  openInNewTab(url?: string) {
    if (!url) return;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null;
  }

  downloadCV(c: any) {
    if (!c?.cv_dl) return this.toastError('Aucun CV disponible');
    this.openInNewTab(c.cv_dl);
  }

  downloadLM(c: any) {
    if (!c?.lm_dl) return this.toastError('Aucune lettre (fichier) disponible');
    this.openInNewTab(c.lm_dl);
  }

  downloadWPForm(c: any) {
  const esc = (s: any) =>
    (s ?? '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://alerte-emploi.example'; // optionnel fallback

  const hasLmFile = !!c?.lm_dl;
  const lmBlock = hasLmFile
    ? `
      <div class="value">
        <a href="${c.lm_dl}" target="_blank" rel="noopener" class="file-link">
          Télécharger la lettre de motivation
        </a>
      </div>`
    : `
      <div class="value pre">${esc(c?.motivationText || '—')}</div>`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Candidature</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  /* Layout & card */
  body { margin:0; background:#eceff3; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111827; }
  .wrap { max-width:800px; margin:32px auto; padding:0 16px; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:28px; }
  .row { margin-bottom:28px; }
  .label { font-weight:600; }
  .value { margin-top:10px; }
  .sep { height:1px; background:#e5e7eb; margin:22px 0; }

  /* Typo */
  a { color:#2563eb; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .email { color:#ea580c; }        /* orange pour l'email */
  .muted { color:#6b7280; }

  /* Pre-like block for LM text */
  .pre { white-space:pre-wrap; line-height:1.6; }

  /* File links */
  .files ul { margin:8px 0 0 18px; padding:0; }
  .files li { margin:6px 0; }
  .file-link { color:#2563eb; }

  /* Footer */
  .footer { text-align:center; margin-top:18px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="row">
        <div class="label">Nom & Prénom(s)</div>
        <div class="value">${esc(c?.fullName || '—')}</div>
      </div>

      <div class="sep"></div>

      <div class="row">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${esc(c?.email || '')}" class="email">${esc(c?.email || '—')}</a></div>
      </div>

      <div class="sep"></div>

      <div class="row">
        <div class="label">Numéro de téléphone</div>
        <div class="value">${esc(c?.telephone || '—')}</div>
      </div>

      <div class="sep"></div>

      <div class="row">
        <div class="label">Offre</div>
        <div class="value">${esc(c?.offreTitre || '—')}</div>
      </div>

      <div class="sep"></div>

      <div class="row">
        <div class="label">Lettre de motivation</div>
        ${lmBlock}
      </div>

      <div class="sep"></div>

      <div class="row files">
        <div class="label">Fichiers</div>
        <ul>
          ${c?.cv_dl ? `<li><a href="${c.cv_dl}" target="_blank" rel="noopener" class="file-link">CV</a></li>` : ''}
          ${c?.lm_dl ? `<li><a href="${c.lm_dl}" target="_blank" rel="noopener" class="file-link">Lettre de motivation</a></li>` : ''}
          ${!c?.cv_dl && !c?.lm_dl ? '<li class="muted">Aucun fichier joint</li>' : ''}
        </ul>
      </div>

      <div class="sep"></div>

      <div class="footer muted">
        Envoyé depuis
        <a href="${origin}" target="_blank" rel="noopener">AlerteEmploi&amp;Offres</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) win.opener = null;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}



  private buildFileUrl(pathOrUrl?: string | null): string | null {
    if (!pathOrUrl) return null;
    const p = String(pathOrUrl);
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    // stocké via Storage::disk('public')->url('...') => souvent "storage/xxx"
    if (p.startsWith('storage/')) return `${BackendURL}${p}`;
    return `${BackendURL}storage/${p}`;
  }

  // Méthodes helper pour extraire les données
  private getFullName(c: Candidature): string {
    if (c.candidat?.user) {
      const prenom = (c.candidat.user as any).prenom || (c.candidat.user as any).firstname || '';
      const nom = (c.candidat.user as any).nom || (c.candidat.user as any).lastname || '';
      return `${prenom} ${nom}`.trim() || '—';
    }
    return '—';
  }

  private getEmail(c: Candidature): string {
    return (c.candidat?.user as any)?.email || '—';
  }

  private getTelephone(c: Candidature): string {
    const u: any = c.candidat?.user;
    return u?.telephone || u?.phone || '—';
  }

  // ---------- Filters ----------
  onOffreChange(): void {
    this.loadCandidatures();
  }

  onGlobalFilter(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  // ---------- Detail ----------
  openDetail(c: any): void {
    this.current = c;
    this.detailDialog = true;
  }

  // ---------- Exports ----------
  exportCSV(): void { this.dt?.exportCSV(); }

  exportPDF(): void {
    const doc = new jsPDF();
    doc.text('Candidatures', 14, 10);

    const head = [['Candidat', 'Email', 'Téléphone', 'Offre', 'Soumise le', 'Statut']];
    const body = this.candidatures().map((c: any) => [
      c.fullName ?? '',
      c.email ?? '',
      c.telephone ?? '',
      c.offreTitre ?? '',
      c.created_at ?? '',
      c.statut ?? ''
    ]);

    autoTable(doc, { head, body, startY: 20 });
    doc.save('candidatures.pdf');
  }

  // ---------- Helpers ----------
  getSeverity(statut?: string) {
    switch (statut) {
      case 'acceptee': return 'success';
      case 'en_attente': return 'warn';
      case 'refusee': return 'danger';
      default: return 'secondary';
    }
  }

  private toastError(detail: string) {
    this.message.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
  }

  private toastSuccess(detail: string) {
    this.message.add({ severity: 'success', summary: 'Succès', detail, life: 3000 });
  }


  changerStatut(candidature: any, nouveauStatut: 'acceptee' | 'refusee'): void {
    if (!candidature.id) return;

    this.loading.set(true);
    this.candService.updateStatut(candidature.id, nouveauStatut)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastSuccess(`Candidature ${nouveauStatut === 'acceptee' ? 'acceptée' : 'refusée'}`);
          this.detailDialog = false;
          this.loadCandidatures();
        },
        error: () => this.toastError('Erreur lors de la mise à jour du statut')
      });
  }

  openModifyDialog(candidature: any): void {
    this.currentToModify = candidature;
    this.nouveauStatut = candidature.statut;
    this.motifRefus = '';
    this.modifyDialog = true;
  }

  confirmModifyStatut(): void {
    if (!this.currentToModify || !this.nouveauStatut) return;

    this.loading.set(true);
    this.candService.updateStatut(this.currentToModify.id!, this.nouveauStatut)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastSuccess(`Statut modifié vers "${this.nouveauStatut}"`);
          this.modifyDialog = false;
          this.loadCandidatures();
        },
        error: () => this.toastError('Erreur lors de la modification du statut')
      });
  }

  deleteCandidature(candidature: any): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la candidature de ${candidature.fullName} ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.loading.set(true);
        this.candService.delete(candidature.id!)
          .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.toastSuccess('Candidature supprimée');
              this.loadCandidatures();
            },
            error: () => this.toastError('Erreur lors de la suppression')
          });
      }
    });
  }

  canReapply(candidature: any): boolean {
    return candidature.statut === 'refusee';
  }

  reapply(candidature: any): void {
    console.log('Postuler à nouveau pour:', candidature);
  }

  openPostulerDialog(): void {
    console.log('Ouvrir dialog de candidature');
  }

  // -------- Téléchargements fichiers --------
  


  private escapeHtml(s: string): string {
    return (s ?? '').toString()
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
}
