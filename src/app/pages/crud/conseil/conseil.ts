import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';
import { CalendarIcon } from 'primeng/icons';
import { ConseilService } from './conseil.service';
import { Conseil } from './conseil.model';
import { TooltipModule } from 'primeng/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-conseil',
    standalone: true,
    imports: [
        CommonModule, TableModule, FormsModule, ButtonModule, RippleModule,
        ToastModule, ToolbarModule, RatingModule, InputTextModule, TextareaModule,
        SelectModule, RadioButtonModule, InputNumberModule, DialogModule, TagModule,
        InputIconModule, IconFieldModule, ConfirmDialogModule, DatePickerModule,
        EditorModule, TooltipModule
    ],
    templateUrl: './conseil.component.html',
    providers: [MessageService, ConseilService, ConfirmationService],
})
export class ConseilComponent implements OnInit {
    conseilDialog: boolean = false;
    conseils = signal<Conseil[]>([]);
    conseil: Conseil = {};
    selectedConseils: Conseil[] | null = null;
    submitted: boolean = false;
    isEditMode: boolean = false;
    detailConseilDialog = false;
    conseilDetail: any | null = null;

    // ✅ NOUVEAU — Image
    imageFile: File | null = null;
    imagePreview: string | null = null;
    readonly MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 Mo

    @ViewChild('dt') dt!: Table;
    cols!: Column[];
    exportColumns!: ExportColumn[];

    categorieOptions = [
        { label: '💼 Recherche d\'emploi',        value: 'recherche_emploi' },
        { label: '📄 CV/Resume',                   value: 'cv_resume' },
        { label: '💬 Entretien d\'embauche',       value: 'entretien' },
        { label: '✉️ Lettre de motivation',        value: 'lettre_motivation' },
        { label: '🚀 Développement professionnel', value: 'developpement_pro' },
        { label: '💰 Négociation salariale',       value: 'negociation_salaire' },
        { label: '🌟 Personal branding',           value: 'personal_branding' },
        { label: '📚 Formation et compétences',    value: 'formation' },
        { label: '🎯 Général',                     value: 'general' }
    ];

    typeOptions = [
        { label: '📖 Article complet',   value: 'article' },
        { label: '💡 Conseil rapide',    value: 'conseil_rapide' },
        { label: '📋 Liste de conseils', value: 'liste' },
        { label: '🎥 Vidéo',             value: 'video' },
        { label: '📊 Infographie',       value: 'infographie' }
    ];

    niveauOptions = [
        { label: '🟢 Débutant',      value: 'debutant' },
        { label: '🟡 Intermédiaire', value: 'intermediaire' },
        { label: '🔴 Avancé',        value: 'avance' }
    ];

    statutOptions = [
        { label: '✏️ Brouillon',  value: 'brouillon' },
        { label: '⏰ Programmé',  value: 'programme' },
        { label: '✅ Publié',     value: 'publie' },
        { label: '📦 Archivé',    value: 'archive' }
    ];

    constructor(
        private conseilService: ConseilService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.loadConseils();
        this.initializeColumns();
    }

    private initializeColumns() {
        this.cols = [
            { field: 'titre',            header: 'Titre' },
            { field: 'categorie',        header: 'Catégorie' },
            { field: 'type_conseil',     header: 'Type' },
            { field: 'niveau',           header: 'Niveau' },
            { field: 'statut',           header: 'Statut' },
            { field: 'vues',             header: 'Vues' },
            { field: 'date_publication', header: 'Date Publication' },
        ];
        this.exportColumns = this.cols.map(col => ({ title: col.header, dataKey: col.field }));
    }

    loadConseils() {
        this.conseilService.getConseils().subscribe({
            next: (resp: any) => {
                const list = Array.isArray(resp)
                    ? resp
                    : resp?.data?.data ?? resp?.data ?? resp?.content ?? [];

                const mapped: Conseil[] = list.map((c: any) => ({
                    id:               c.id,
                    titre:            c.titre,
                    contenu:          c.contenu,
                    categorie:        c.categorie ?? 'general',
                    type_conseil:     c.type_conseil ?? 'article',
                    niveau:           c.niveau ?? 'debutant',
                    statut:           c.statut ?? 'brouillon',
                    tags:             c.tags ?? '',
                    auteur:           c.auteur ?? '',
                    vues:             c.vues ?? 0,
                    date_publication: c.date_publication ?? null,
                    date_creation:    c.created_at ?? null,
                    date_modification:c.updated_at ?? null,
                    image:            c.image ?? null, // ✅ NOUVEAU
                }));

                this.conseils.set(mapped);
            },
            error: (err) => {
                console.error('Erreur lors du chargement des conseils', err);
                this.showErrorMessage('Erreur lors du chargement des conseils');
                this.conseils.set([]);
            },
        });
    }

    openNew() {
        this.conseil = {
            statut: 'brouillon',
            niveau: 'debutant',
            type_conseil: 'article',
            categorie: 'general'
        };
        this.submitted   = false;
        this.isEditMode  = false;
        this.imageFile   = null;    // ✅
        this.imagePreview = null;   // ✅
        this.conseilDialog = true;
    }

    editConseil(conseil: Conseil) {
        this.conseil     = { ...conseil };
        this.isEditMode  = true;
        this.submitted   = false;
        this.imageFile   = null;    // ✅
        this.imagePreview = null;   // ✅ on garde conseil.image pour afficher l'existante
        this.conseilDialog = true;
    }

    // ✅ NOUVEAU — Gestion upload image
    onImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        if (!file) return;
        if (file.size > this.MAX_IMAGE_BYTES) {
            this.showWarnMessage('Image trop volumineuse (max 2 Mo)');
            input.value = '';
            return;
        }
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => { this.imagePreview = e.target?.result as string; };
        reader.readAsDataURL(file);
    }

    deleteSelectedConseils() {
        if (!this.selectedConseils || this.selectedConseils.length === 0) {
            this.showWarnMessage('Aucun conseil sélectionné');
            return;
        }
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer ${this.selectedConseils.length} conseil(s) ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                if (this.selectedConseils) {
                    let deletedCount = 0;
                    this.selectedConseils.forEach((conseil) => {
                        if (conseil.id) {
                            this.conseilService.deleteConseil(conseil.id).subscribe({
                                next: () => {
                                    this.conseils.set(this.conseils().filter(val => val.id !== conseil.id));
                                    deletedCount++;
                                    if (deletedCount === this.selectedConseils?.length) {
                                        this.showSuccessMessage(`${deletedCount} conseil(s) supprimé(s) avec succès`);
                                    }
                                },
                                error: () => this.showErrorMessage('Erreur lors de la suppression')
                            });
                        }
                    });
                    this.selectedConseils = null;
                }
            },
        });
    }

    deleteConseil(conseil: Conseil) {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer "${conseil.titre}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                if (conseil.id) {
                    this.conseilService.deleteConseil(conseil.id).subscribe({
                        next: () => {
                            this.conseils.set(this.conseils().filter(val => val.id !== conseil.id));
                            this.showSuccessMessage('Conseil supprimé avec succès');
                        },
                        error: () => this.showErrorMessage('Erreur lors de la suppression du conseil')
                    });
                }
            },
        });
    }

    // ✅ MODIFIÉ — passe imageFile au service
    saveConseil() {
        this.submitted = true;
        if (!this.isFormValid()) {
            this.showWarnMessage('Veuillez remplir tous les champs obligatoires');
            return;
        }
        const conseilToSave = {
            ...this.conseil,
            contenu: this.normalizeEditorHtml(this.conseil.contenu || '')
        };
        const operation = this.isEditMode
            ? this.conseilService.updateConseil(conseilToSave, this.imageFile)
            : this.conseilService.createConseil(conseilToSave, this.imageFile);

        operation.subscribe({
            next: () => {
                this.showSuccessMessage(this.isEditMode ? 'Conseil modifié avec succès' : 'Conseil créé avec succès');
                this.loadConseils();
                this.hideDialog();
            },
            error: (err) => {
                console.error('Erreur sauvegarde', err);
                this.showErrorMessage(this.isEditMode ? 'Erreur lors de la modification' : 'Erreur lors de la création');
            }
        });
    }

    openConseilDetail(c: any) {
        this.conseilDetail = c;
        this.detailConseilDialog = true;
    }

    safeHtml(html: string | undefined | null): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.normalizeForView(html));
    }

    splitTags(tags: string): string[] {
        return (tags || '').split(',').map(t => t.trim()).filter(Boolean);
    }

    getTempsLectureFrom(html?: string | null): number {
        if (!html) return 1;
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = text ? text.split(' ').length : 0;
        return Math.max(1, Math.round(words / 200));
    }

    private isFormValid(): boolean {
        return !!(
            this.conseil.titre?.trim() &&
            this.conseil.contenu?.trim() &&
            this.conseil.categorie &&
            this.conseil.type_conseil &&
            this.conseil.niveau &&
            this.conseil.statut
        );
    }

    // ✅ MODIFIÉ — réinitialise l'image
    hideDialog() {
        this.conseilDialog = false;
        this.submitted     = false;
        this.conseil       = {};
        this.isEditMode    = false;
        this.imageFile     = null;    // ✅
        this.imagePreview  = null;    // ✅
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() { this.dt.exportCSV(); }

    private showSuccessMessage(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail, life: 3000 });
    }
    private showErrorMessage(detail: string) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
    }
    private showWarnMessage(detail: string) {
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail, life: 4000 });
    }

    get dialogHeader(): string {
        return this.isEditMode ? 'Modifier le conseil' : 'Nouveau conseil';
    }

    get hasSelectedConseils(): boolean {
        return !!(this.selectedConseils && this.selectedConseils.length > 0);
    }

    isFieldInvalid(fieldName: keyof Conseil): boolean {
        return this.submitted && !this.conseil[fieldName]?.toString().trim();
    }

    getCategorieLabel(value: string): string {
        return this.categorieOptions.find(opt => opt.value === value)?.label ?? value;
    }
    getTypeLabel(value: string): string {
        return this.typeOptions.find(opt => opt.value === value)?.label ?? value;
    }
    getNiveauLabel(value: string): string {
        return this.niveauOptions.find(opt => opt.value === value)?.label ?? value;
    }
    getStatutLabel(value: string): string {
        return this.statutOptions.find(opt => opt.value === value)?.label ?? value;
    }

    getStatutSeverity(statut: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (statut) {
            case 'publie':      return 'success';
            case 'programme':   return 'info';
            case 'brouillon':   return 'warn';
            case 'en_revision': return 'info';
            case 'archive':     return 'secondary';
            case 'suspendu':    return 'danger';
            default:            return 'contrast';
        }
    }

    // ✅ MODIFIÉ — passe null pour imageFile
    publierConseil(conseil: Conseil) {
        if (conseil.id) {
            const c = { ...conseil, statut: 'publie', date_publication: new Date() };
            this.conseilService.updateConseil(c, null).subscribe({
                next: () => { this.showSuccessMessage('Conseil publié avec succès'); this.loadConseils(); },
                error: () => this.showErrorMessage('Erreur lors de la publication')
            });
        }
    }

    // ✅ MODIFIÉ — passe null pour imageFile
    archiverConseil(conseil: Conseil) {
        if (conseil.id) {
            const c = { ...conseil, statut: 'archive' };
            this.conseilService.updateConseil(c, null).subscribe({
                next: () => { this.showSuccessMessage('Conseil archivé avec succès'); this.loadConseils(); },
                error: () => this.showErrorMessage('Erreur lors de l\'archivage')
            });
        }
    }

    getTempsLecture(): number {
        if (!this.conseil.contenu) return 0;
        const texteSeul = this.conseil.contenu.replace(/<[^>]*>/g, '');
        const nombreMots = texteSeul.trim().split(/\s+/).filter(mot => mot.length > 0).length;
        return Math.max(1, Math.ceil(nombreMots / 200));
    }

    getApercu(): string {
        if (!this.conseil.contenu) return '';
        const texteSeul = this.conseil.contenu.replace(/<[^>]*>/g, '');
        return texteSeul.length > 150 ? texteSeul.substring(0, 150) + '...' : texteSeul;
    }

    getCompteCaracteres(): number {
        if (!this.conseil.contenu) return 0;
        return this.conseil.contenu.replace(/<[^>]*>/g, '').length;
    }

    getNombreMots(): number {
        if (!this.conseil.contenu) return 0;
        const texteSeul = this.conseil.contenu.replace(/<[^>]*>/g, '');
        return texteSeul.trim().split(/\s+/).filter(mot => mot.length > 0).length;
    }

    getApercuFrom(html: string, maxLength: number, additionalText?: string): string {
        if (!html) return '';
        const texte = this.htmlToText(this.normalizeEditorHtml(html));
        return texte.length > 120 ? texte.slice(0, 120) + '…' : texte;
    }

    normalizeEditorHtml(html: string | null | undefined): string {
        if (!html) return '';
        let out = String(html);
        out = out.replace(/&amp;nbsp;|&nbsp;/g, ' ');
        out = out.replace(/\u00A0/g, ' ');
        out = out.replace(/(\s){2,}/g, ' ');
        out = out.replace(/<p><br><\/p>/g, '<p>&nbsp;</p>');
        return out;
    }

    private htmlToText(html: string): string {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.body.textContent || '').replace(/\u00A0/g, ' ');
    }

    private normalizeForView(html: string | undefined | null): string {
        if (!html) return '';
        let out = String(html);
        out = out.replace(/style="[^"]*(width|height)\s*:\s*[^";]+;?[^"]*"/gi, match =>
            match
                .replace(/width\s*:\s*[^;"]+;?/gi, '')
                .replace(/height\s*:\s*[^;"]+;?/gi, '')
                .replace(/style="\s*"/, '')
        );
        out = out.replace(/(&nbsp;){2,}/g, ' ');
        return out;
    }
}