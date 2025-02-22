import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabel, FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../auth.service';
import { RegisterUser } from './user.model';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: true,
    imports: 
    [ 
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        ReactiveFormsModule,
        PasswordModule,
        FormsModule,
        DropdownModule,
        CommonModule,
    ],
})
export class RegisterComponent implements OnInit {

    user: RegisterUser = {
        id: 0,
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        scope: 'reservant', // Valeur par défaut
        phone: 0
    };
    
    
    value!: string;
    ngOnInit(): void {
        this.initForm();
     }

    valCheck: string[] = ['remember'];

    password!: string;

    formulaire! : FormGroup;
    constructor (
        private fb: FormBuilder,
        private authService: AuthService,) { }

     initForm() {
        this.formulaire = this.fb.group({
             nom: ['', Validators.required],
             prenom: ['', Validators.required],
             email: ['', Validators.required],
             password: ['', [Validators.required, Validators.minLength(8)]],
             scope: ['', Validators.required, Validators.pattern('admin|chef_lab|reservant')],
             phone: ['', Validators.required],
             coche: [false, Validators.requiredTrue],
        })
        
    }  

    async inscription(){
        //fonction qui va permetre d'envoyer les infos du formulaire au backend laravel 
        console.log(this.formulaire.value);
        const registerUser: RegisterUser = this.formulaire.value as RegisterUser;
        
        const resultat = await this.authService.register(registerUser);
        console.log(resultat);
        this.formulaire.reset();
    }

    dropdownValues = [
        { name: 'Administrateur', value: 'admin' },
        { name: 'Responsable', value: 'responsable' },
        { name: 'Réservant', value: 'reservant' }
      ];

}


