import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-offre-redirect',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <p-progressSpinner></p-progressSpinner>
    </div>
  `
})
export class OffreRedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug'); // ✅ slug maintenant
    if (!slug) {
      this.router.navigateByUrl('/notfound');
      return;
    }

    const id = slug.split('-')[0]; // "22-recrutement..." => "22"
    if (!id || isNaN(Number(id))) {
      this.router.navigateByUrl('/notfound');
      return;
    }

    // ✅ Rediriger vers /offres/22
    this.router.navigate(['/offres', id]);
  }
}