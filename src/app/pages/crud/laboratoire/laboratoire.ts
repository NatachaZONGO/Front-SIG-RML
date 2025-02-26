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
import { Laboratoireservice } from './laboratoire.service';
import { Laboratoire } from './laboratoire.model';
import { Ufr } from '../ufr/ufr.model';
import { User } from '../user/user.model';
import { Ufrservice } from '../ufr/ufr.service';
import { UserService } from '../user/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { forkJoin } from 'rxjs';


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
        DropdownModule
   
    ],
    templateUrl: `./laboratoire.component.html`,
    providers: [MessageService, Laboratoireservice, ConfirmationService],
})
export class Laboratoiree implements OnInit {
    laboratoireDialog: boolean = false;
   
    laboratoires: any[] = []; 
    laboratoire: Laboratoire = {};
    selectedLaboratoires: Laboratoire[] = []; 
    submitted: boolean = false;
    ufrs: Ufr[] = []; // Liste des UFR
    responsables: User[] = []; // Liste des responsables

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private laboratoireService: Laboratoireservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private ufrService: Ufrservice,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        // Chargez les UFRs, les responsables et les laboratoires en parallèle
        forkJoin({
            ufrs: this.ufrService.getUfrs(),
            responsables: this.userService.getUsersByRole('responsable'),
            laboratoires: this.laboratoireService.getLaboratoires()
        }).subscribe({
            next: (response) => {
                // Chargez les UFRs
                this.ufrs = response.ufrs.content; // Assurez-vous que la structure correspond à votre API
                console.log('UFRs loaded:', this.ufrs);
    
                // Chargez les responsables
                this.responsables = response.responsables.map((responsable) => ({
                    ...responsable,
                    fullName: `${responsable.firstname} ${responsable.lastname}` // Créez une propriété `fullName`
                }));
                console.log('Responsables loaded:', this.responsables);
    
                // Extrayez la propriété `content` des laboratoires
                const laboratoires = response.laboratoires.content;
    
                // Mappez les laboratoires
                const laboratoiresMappes = laboratoires.map((laboratoire) => {
                    const ufr = this.ufrs.find((u) => u.id === laboratoire.ufr_id);
                    const responsable = this.responsables.find((r) => r.id === laboratoire.responsable_id);
                    return {
                        ...laboratoire,
                        ufr: ufr,
                        responsable: responsable
                    };
                });
    
                // Mettez à jour la liste des laboratoires
                this.laboratoires = laboratoiresMappes;
                console.log('Laboratoires chargés:', laboratoiresMappes);
            },
            error: (err) => console.error('Erreur lors du chargement des données', err)
        });
    }

    loadLaboratoires() {
        this.laboratoireService.getLaboratoires().subscribe({
            next: (response: { content: Laboratoire[] }) => {
                const laboratoires = response.content;
                // Mappez les laboratoires pour inclure les objets `ufr` et `responsable`
                const laboratoiresMappes = laboratoires.map((laboratoire) => {
                    // Trouvez l'UFR correspondante
                    const ufr = this.ufrs.find((u) => u.id === laboratoire.ufr_id);
                // Trouvez le responsable correspondant
                const responsable = this.responsables.find((r) => r.id === laboratoire.responsable_id);
                    // Retournez un nouvel objet avec les données complètes
                    return {
                        ...laboratoire,
                        ufr: ufr, // Ajoutez l'objet UFR
                        responsable: responsable // Ajoutez l'objet Responsable
                    };
                });
    
                this.laboratoires = laboratoiresMappes;
                console.log('Laboratoires chargés:', laboratoiresMappes); // Vérifiez les données dans la console
            },
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
                        if (laboratoire.id) {
                            this.laboratoireService.deleteLaboratoire(laboratoire.id).subscribe({
                                next: () => {
                                    this.laboratoires = this.laboratoires.filter((val) => val.id !== laboratoire.id);

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
            message: 'Êtes-vous sûr de vouloir supprimer ' + laboratoire.nom + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (laboratoire.id) {
                    this.laboratoireService.deleteLaboratoire(laboratoire.id).subscribe({
                        next: () => {
                            this.laboratoires = this.laboratoires.filter((val) => val.id !== laboratoire.id);
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
    
        // Vérifiez que les champs obligatoires sont remplis
        if (this.laboratoire.nom?.trim() && this.laboratoire.description?.trim()) {
            // Créez un nouvel objet avec les champs attendus par le serveur
            const laboratoireData = {
                nom: this.laboratoire.nom,
                description: this.laboratoire.description,
                ufr_id: this.laboratoire.ufr?.id, // Extrayez l'ID de l'UFR
                responsable_id: this.laboratoire.responsable?.id // Extrayez l'ID du responsable
            };
    
            if (this.laboratoire.id) {
                // Mise à jour d'un laboratoire existant
                this.laboratoireService.updateLaboratoire({ ...laboratoireData, id: this.laboratoire.id }).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoire modifié', life: 3000 });
                        this.loadLaboratoires();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour du laboratoire', err),
                });
            } else {
                // Création d'un nouveau laboratoire
                this.laboratoireService.createLaboratoire(laboratoireData).subscribe({
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