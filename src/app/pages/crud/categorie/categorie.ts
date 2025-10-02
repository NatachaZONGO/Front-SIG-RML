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
import { CalendarIcon } from 'primeng/icons';
import { HttpErrorResponse } from '@angular/common/http';
import { Cateorie } from './categorie.model';
import { CategorieService } from './categorie.service';


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
    selector: 'app-categorie-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DatePickerModule,
   
    ],
    templateUrl: `./categorie.component.html`,
    providers: [MessageService, CategorieService, ConfirmationService],
})
export class CategorieComponent implements OnInit {
    categorieDialog: boolean = false;
    categories = signal<Cateorie[]>([]);
    categorie: Cateorie = {};
    selectedCategories: Cateorie[] | null = null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private categorieService: CategorieService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadCategories();
        this.cols = [
            { field: 'nom', header: 'Nom' },
            { field: 'description', header: 'Description' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadCategories() {
        this.categorieService.getCategories().subscribe({
            next: (res: any) => {
                 this.categories.set(res.data);// Support pour data.content ou data direct
            },
            error: (err: HttpErrorResponse) => console.error('Erreur lors du chargement des catégories', err),
        });
    }

    openNew() {
        this.categorie = {};
        this.submitted = false;
        this.categorieDialog = true;
    }

    editCategorie(categorie: Cateorie) {
        this.categorie = { ...categorie };
        this.categorieDialog = true;
    }

    deleteSelectedCategories() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les catégories sélectionnées ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedCategories) {
                    this.selectedCategories.forEach((categorie) => {
                        if (categorie.id) {
                            this.categorieService.deleteCategorie(categorie.id).subscribe({
                                next: () => {
                                    this.categories.set(this.categories().filter((val) => val.id !== categorie.id));
                                },
                                error: (err: HttpErrorResponse) => console.error('Erreur lors de la suppression de la catégorie', err),
                            });
                        }
                    });
                    this.selectedCategories = null;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Catégories supprimées', life: 3000 });
                }
            },
        });
    }

    deleteCategorie(categorie: Cateorie) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + categorie.nom + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (categorie.id) {
                    this.categorieService.deleteCategorie(categorie.id).subscribe({
                        next: () => {
                            this.categories.set(this.categories().filter((val) => val.id !== categorie.id));
                            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Catégorie supprimée', life: 3000 });
                        },
                        error: (err: HttpErrorResponse) => console.error('Erreur lors de la suppression de la catégorie', err),
                    });
                }
            },
        });
    }

    saveCategorie() {
        this.submitted = true;
        if (this.categorie.nom?.trim() && this.categorie.description?.trim()) {
            if (this.categorie.id) {
                // Mise à jour d'une catégorie existante
                this.categorieService.updateCategorie(this.categorie).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Catégorie modifiée', life: 3000 });
                        this.loadCategories();
                    },
                    error: (err: HttpErrorResponse) => console.error('Erreur lors de la mise à jour de la catégorie', err),
                });
            } else {
                // Création d'une nouvelle catégorie
                this.categorieService.createCategorie(this.categorie).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Catégorie ajoutée', life: 3000 });
                        this.loadCategories();
                    },
                    error: (err: HttpErrorResponse) => console.error('Erreur lors de la création de la catégorie', err),
                });
            }
            this.categorieDialog = false;
            this.categorie = {};
        }
    }

    hideDialog() {
        this.categorieDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}