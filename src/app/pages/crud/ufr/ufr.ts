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
import { Ufr, Ufrservice } from './ufr.service';

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
    templateUrl: `./ufr.component.html`,
    providers: [MessageService, Ufrservice, ConfirmationService],
})
export class Ufrr implements OnInit {
    ufrDialog: boolean = false;
    ufrs = signal<Ufr[]>([]);
    ufr: Ufr = {};
    selectedUfrs: Ufr[] | null = null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private ufrService: Ufrservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadUfrs();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'createdAt', header: 'Date Ajout' },
            { field: 'updatedAt', header: 'Date Modification' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUfrs() {
        this.ufrService.getUfrs().subscribe({
            next: (data) => this.ufrs.set(data),
            error: (err) => console.error('Erreur lors du chargement des UFRs', err),
        });
    }

    openNew() {
        this.ufr = {};
        this.submitted = false;
        this.ufrDialog = true;
    }

    editUfr(ufr: Ufr) {
        this.ufr = { ...ufr };
        this.ufrDialog = true;
    }

    deleteSelectedUfrs() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les UFRs sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedUfrs) {
                    this.selectedUfrs.forEach((ufr) => {
                        if (ufr._id) {
                            this.ufrService.deleteUfr(ufr._id).subscribe({
                                next: () => {
                                    this.ufrs.set(this.ufrs().filter((val) => val._id !== ufr._id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression de l\'UFR', err),
                            });
                        }
                    });
                    this.selectedUfrs = null;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFRs supprimés', life: 3000 });
                }
            },
        });
    }

    deleteUfr(ufr: Ufr) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + ufr.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (ufr._id) {
                    this.ufrService.deleteUfr(ufr._id).subscribe({
                        next: () => {
                            this.ufrs.set(this.ufrs().filter((val) => val._id !== ufr._id));
                            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression de l\'UFR', err),
                    });
                }
            },
        });
    }

    saveUfr() {
        this.submitted = true;
        if (this.ufr.name?.trim() && this.ufr.description?.trim()) {
            if (this.ufr._id) {
                // Mise à jour d'un UFR existant
                this.ufr.updatedAt = new Date(); // Met à jour la date de modification
                this.ufrService.updateUfr(this.ufr).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR modifié', life: 3000 });
                        this.loadUfrs();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour de l\'UFR', err),
                });
            } else {
                // Création d'un nouvel UFR
                this.ufr.createdAt = new Date(); // Définit la date de création
                this.ufr.updatedAt = new Date(); // Définit la date de modification
                this.ufrService.createUfr(this.ufr).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR ajouté', life: 3000 });
                        this.loadUfrs();
                    },
                    error: (err) => console.error('Erreur lors de la création de l\'UFR', err),
                });
            }
            this.ufrDialog = false;
            this.ufr = {};
        }
    }

    hideDialog() {
        this.ufrDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}