import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { TopbarWidget } from '../topbarwidget.component';
import { FooterWidget } from '../footerwidget';
import { ConseilService } from '../../../crud/conseil/conseil.service';
import { Conseil } from '../../../crud/conseil/conseil.model';
import { BackendURL } from '../../../../const.dev';

@Component({
  selector: 'app-conseils-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, RippleModule, TagModule,
    InputTextModule, PaginatorModule, DialogModule,
    TopbarWidget, FooterWidget
  ],
  providers: [ConseilService],
  templateUrl: './conseils-list.component.html',
})
export class ConseillsListComponent implements OnInit {

  allConseils: Conseil[] = [];
  q = '';
  rows = 9;
  first = 0;

  // Dialog
  conseilDialogVisible = false;
  currentConseil: Conseil | null = null;
  conseilSafeHtml: SafeHtml | null = null;
  loadingConseil = false;

  constructor(
    private conseilApi: ConseilService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConseils();
  }

  private loadConseils(): void {
    this.conseilApi.getConseils(1, 200).subscribe({
      next: (res) => {
        const list: Conseil[] = res.content || [];
        this.allConseils = list
          .filter(c => (c.statut || '').toLowerCase() === 'publie')
          .sort((a, b) => {
            const dA = a.date_publication ? new Date(a.date_publication as any).getTime() : 0;
            const dB = b.date_publication ? new Date(b.date_publication as any).getTime() : 0;
            return dB - dA;
          });
      },
      error: () => { this.allConseils = []; }
    });
  }

  filtered(): Conseil[] {
    if (!this.q.trim()) return this.allConseils;
    const s = this.q.toLowerCase();
    return this.allConseils.filter(c =>
      (c.titre || '').toLowerCase().includes(s) ||
      (c.categorie || '').toLowerCase().includes(s) ||
      (c.niveau || '').toLowerCase().includes(s)
    );
  }

  pageRows(): Conseil[] {
    return this.filtered().slice(this.first, this.first + this.rows);
  }

  total(): number { return this.filtered().length; }

  onPage(e: any): void {
    this.first = e.first;
    this.rows = e.rows;
  }

  clear(): void {
    this.q = '';
    this.first = 0;
  }

  excerpt(html: string, max = 180): string {
    const div = document.createElement('div');
    div.innerHTML = (html || '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
    const txt = (div.textContent || '').replace(/\s+/g, ' ').trim();
    return txt.length <= max ? txt : txt.slice(0, max - 1) + '…';
  }

  openConseilDialog(t: Conseil): void {
    this.currentConseil = t;
    this.conseilDialogVisible = true;

    const htmlInline = (t as any)?.contenu_html ?? (t as any)?.html ?? null;
    if (htmlInline) {
      this.conseilSafeHtml = this.sanitizer.bypassSecurityTrustHtml(String(htmlInline));
      return;
    }

    const mdInline = t?.contenu ?? null;
    if (mdInline) {
      this.conseilSafeHtml = this.sanitizer.bypassSecurityTrustHtml(String(mdInline));
      return;
    }

    if (!t?.id) return;
    this.loadingConseil = true;
    this.http.get<any>(`${BackendURL}conseils/${t.id}`).subscribe({
      next: (res) => {
        const d = res?.data ?? res;
        this.currentConseil = { ...t, ...d };
        const raw = d?.contenu_html ?? d?.html ?? d?.contenu ?? '';
        this.conseilSafeHtml = this.sanitizer.bypassSecurityTrustHtml(String(raw));
        this.loadingConseil = false;
      },
      error: () => { this.loadingConseil = false; }
    });
  }
}