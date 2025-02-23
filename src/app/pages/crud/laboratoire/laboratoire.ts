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
import { Laboratoire, Laboratoireservice } from './laboratoire.service';

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
    selector: 'app-crud',
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
    templateUrl: `./laboratoire.component.html`,
    providers: [MessageService, Laboratoireservice, ConfirmationService],
})
export class Laboratoiree implements OnInit {
    laboratoireDialog: boolean = false;
    laboratoires = signal<Laboratoire[]>([]);
    laboratoire: Laboratoire = {};
    selectedLaboratoires: Laboratoire[] = []; 
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private laboratoireService: Laboratoireservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadLaboratoires();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'createdAt', header: 'Date Ajout' },
            { field: 'updatedAt', header: 'Date Modification' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadLaboratoires() {
        this.laboratoireService.getLaboratoires().subscribe({
            next: (data) => this.laboratoires.set(data),
            error: (err) => console.error('Erreur lors du chargement des laboratoires', err),
        });
    }

    openNew() {
        this.laboratoire = {};
        this.submitted = false;
        this.laboratoireDialog = true;
    }

    editLaboratoire(laboratoire: Laboratoire) {
        this.laboratoire = { ...laboratoire };
        this.laboratoireDialog = true;
    }

    deleteSelectedLaboratoires() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les laboratoires sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedLaboratoires) {
                    this.selectedLaboratoires.forEach((laboratoire) => {
                        if (laboratoire._id) {
                            this.laboratoireService.deleteLaboratoire(laboratoire._id).subscribe({
                                next: () => {
                                    this.laboratoires.set(this.laboratoires().filter((val) => val._id !== laboratoire._id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression du laboratoire', err),
                            });
                        }
                    });
                    this.selectedLaboratoires = [];
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoires supprimés', life: 3000 });
                }
            },
        });
    }

    deleteLaboratoire(laboratoire: Laboratoire) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + laboratoire.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (laboratoire._id) {
                    this.laboratoireService.deleteLaboratoire(laboratoire._id).subscribe({
                        next: () => {
                            this.laboratoires.set(this.laboratoires().filter((val) => val._id !== laboratoire._id));
                            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoire supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression du laboratoire', err),
                    });
                }
            },
        });
    }

    saveLaboratoire() {
        this.submitted = true;
        if (this.laboratoire.name?.trim() && this.laboratoire.description?.trim()) {
            if (this.laboratoire._id) {
                // Mise à jour d'un UFR existant
                this.laboratoire.updatedAt = new Date(); // Met à jour la date de modification
                this.laboratoireService.updateLaboratoire(this.laboratoire).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR modifié', life: 3000 });
                        this.loadLaboratoires();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour du laboratoire', err),
                });
            } else {
                // Création d'un nouvel UFR
                this.laboratoire.createdAt = new Date(); // Définit la date de création
                this.laboratoire.updatedAt = new Date(); // Définit la date de modification
                this.laboratoireService.createLaboratoire(this.laboratoire).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoire ajouté', life: 3000 });
                        this.loadLaboratoires();
                    },
                    error: (err) => console.error('Erreur lors de la création du laboratoire', err),
                });
            }
            this.laboratoireDialog = false;
            this.laboratoire = {};
        }
    }

    hideDialog() {
        this.laboratoireDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}