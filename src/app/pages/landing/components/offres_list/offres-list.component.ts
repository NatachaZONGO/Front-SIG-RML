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

import { Router } from '@angular/router';
import { TopbarWidget } from '../topbarwidget.component';
import { OffreService } from '../../../crud/offre/offre.service';
import { enrichOffreForUi, Offre } from '../../../crud/offre/offre.model';

@Component({
  selector: 'app-offres-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    PaginatorModule,
    InputTextModule,
    DialogModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule,
    RadioButtonModule,
    SelectModule,
    ToastModule,
    TopbarWidget
  ],
  templateUrl: './offres-list.component.html',
  providers: [MessageService],
  styles: [`
    .card{ padding:1rem;border:1px solid #e5e7eb;border-radius:.5rem;background:#fff; transition: box-shadow .2s ease; }
    .card:hover{ box-shadow:0 8px 20px rgba(0,0,0,.06); }
    .clamp-3{ display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;-webkit-line-clamp:3;line-clamp:3; }
    .chip{ font-size:.75rem; padding:.25rem .5rem; border-radius:.375rem; background:#d1fae5; color:#047857; white-space:nowrap;}
    .chip.vedette{ background:#fde68a; color:#92400e; }
    .offer-html p { margin:.5rem 0; line-height:1.6; }
    .offer-html ul,.offer-html ol { margin:.5rem 1.25rem; }
    .offer-html h1,.offer-html h2,.offer-html h3 { margin:.75rem 0 .25rem; }
    .details-footer { position: sticky; bottom:0; padding-top:1rem; background:#fff; display:flex; justify-content:flex-end; }
    .apply-form .row { display:flex; gap:1rem; margin-bottom:1rem; align-items:center; flex-wrap:wrap; }
    .apply-form .row.two > .field { flex:1 1 0; min-width:220px; }
    .apply-form .field { display:flex; flex-direction:column; gap:.35rem; flex:1 1 100%; }
    .apply-form .footer { display:flex; justify-content:flex-end; gap:.5rem; margin-top:.5rem; }
    .muted { color:#6b7280; font-size:.85rem; }
  `]
})
export class OffresListComponent implements OnInit {
  constructor(
    private api: OffreService,
    private router: Router,
    private messageService: MessageService
  ) {}

  // ====== ÉTAT LISTE ======
  all = signal<Offre[]>([]);
  q = '';           // <-- reste une string (pas un signal)
  page = 0;
  rows = 9;

  // ====== DIALOG DÉTAIL ======
  detailsVisible = false;
  selectedOffre?: Offre;

  // ====== DIALOG POSTULER ======
  applyVisible = false;
  isAuth = false;
  today = new Date().toISOString().slice(0, 10);
  cvFile?: File | null;
  lmFile?: File | null;

  apply: any = {
    nom: '', prenom: '', email: '', ville: '', date_naissance: '',
    sexe: '', niveau_etude: null, disponibilite: '', disponibilite_autre: '',
    phone: '', pays: null, experience: null,
    cvChoice: 'upload', lmChoice: 'text', motivation: '', reviewNow: false
  };

  paysOptions = [
    { label: 'Burkina Faso', value: 'BF', code: 'BF', flag: 'https://flagcdn.com/w20/bf.png' },
    { label: 'Côte d’Ivoire', value: 'CI', code: 'CI', flag: 'https://flagcdn.com/w20/ci.png' },
    { label: 'Mali', value: 'ML', code: 'ML', flag: 'https://flagcdn.com/w20/ml.png' },
  ];
  niveauEtudeOptions = [
    { label: 'CAP / BEP', value: 'cap_bep' },
    { label: 'BAC', value: 'bac' },
    { label: 'BAC+2', value: 'bac+2' },
    { label: 'BAC+3', value: 'bac+3' },
    { label: 'BAC+5 et plus', value: 'bac+5' }
  ];

  // ---------- Helpers de normalisation / rendu ----------
  private decodeHtml(html: string): string {
    // Supprime balises + décode entités HTML + remplace espaces insécables
    const div = document.createElement('div');
    div.innerHTML = (html || '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n');
    const text = (div.textContent || div.innerText || '').replace(/\u00A0/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
  }

  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  plain(html: string): string {
    return this.decodeHtml(html);
  }

  // ---------- Init ----------
  ngOnInit(): void {
    this.api.getAdminOffres().subscribe({
      next: (rows) => {
        const enriched = (rows || [])
          .map(enrichOffreForUi)
          .filter(o => o.statut === 'publiee' && !o.isExpired)
          .map(o => ({
            ...o,
            _plainDescription: this.decodeHtml(o.description || '')
          }) as Offre & { _plainDescription: string });
        this.all.set(enriched);
      },
      error: () => this.all.set([])
    });
  }

  // ---------- Filtrage (MÉTHODES, pas de signals) ----------
  filtered(): Offre[] {
    const qn = this.normalize(this.q);
    if (!qn) return this.all();

    return this.all().filter((o: any) => {
      const titre = this.normalize(o.titre || '');
      const ent = this.normalize(o.entreprise?.nom_entreprise || '');
      const loc = this.normalize(o.localisation || '');
      const desc = this.normalize(o._plainDescription || this.decodeHtml(o.description || ''));
      return titre.includes(qn) || ent.includes(qn) || loc.includes(qn) || desc.includes(qn);
    });
  }

  total(): number {
    // On affiche le nombre de résultats filtrés
    return this.filtered().length;
  }

  // ---------- Pagination ----------
  pageRows(): Offre[] {
    const start = this.page * this.rows;
    return this.filtered().slice(start, start + this.rows);
  }
  onPage(e: any) { this.page = e.page; this.rows = e.rows; }
  clear() { this.q = ''; this.page = 0; }

  // ---------- Parité landing ----------
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
    this.detailsVisible = true;
  }

  goToJob(id: number) {
    this.router.navigate(['/offres', id]);
  }

  // ---------- Postuler ----------
  postuler(o: Offre) {
    this.selectedOffre = o;
    this.applyVisible = true;
  }
  onApplyFile(e: Event) {
    const input = e.target as HTMLInputElement;
    this.cvFile = input.files?.[0] || null;
  }
  onApplyLmFile(e: Event) {
    const input = e.target as HTMLInputElement;
    this.lmFile = input.files?.[0] || null;
  }
  goLogin() {
    this.applyVisible = false;
    this.router.navigate(['/connexion'], { queryParams: { redirect: this.router.url } });
  }
  submitApplication(form: any) {
    if (form.invalid) return;

    const fd = new FormData();
    fd.append('offre_id', String(this.selectedOffre?.id || ''));
    fd.append('nom', this.apply.nom || '');
    fd.append('prenom', this.apply.prenom || '');
    fd.append('email', this.apply.email || '');
    fd.append('ville', this.apply.ville || '');
    if (!this.isAuth) {
      fd.append('date_naissance', this.apply.date_naissance || '');
      fd.append('sexe', this.apply.sexe || '');
      fd.append('niveau_etude', this.apply.niveau_etude || '');
      fd.append('disponibilite', this.apply.disponibilite || '');
      if (this.apply.disponibilite === 'autre') {
        fd.append('disponibilite_autre', this.apply.disponibilite_autre || '');
      }
    }
    fd.append('phone', this.apply.phone || '');
    if (this.apply.pays) fd.append('pays', this.apply.pays);
    if (this.apply.experience != null) fd.append('experience', String(this.apply.experience));

    if (this.apply.cvChoice === 'upload' && this.cvFile) {
      fd.append('cv', this.cvFile);
    } else if (this.apply.cvChoice === 'existing') {
      fd.append('use_existing_cv', '1');
    }

    if (this.apply.lmChoice === 'text') {
      fd.append('motivation', this.apply.motivation || '');
    } else if (this.lmFile) {
      fd.append('lm_file', this.lmFile);
    }

    // TODO: appeler votre API de candidature ici
    this.messageService.add({ severity: 'success', summary: 'Candidature', detail: 'Candidature envoyée !', life: 3000 });
    this.applyVisible = false;
    this.cvFile = null; this.lmFile = null;
  }
}
