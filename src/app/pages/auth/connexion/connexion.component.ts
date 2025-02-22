
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserConnexion } from './userconnexion.model';

@Component({
    selector: 'app-connexion',
    templateUrl: './connexion.component.html',
    standalone: true,
    imports: [
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        ReactiveFormsModule
    ]
})
export class ConnexionComponent implements OnInit {
    formulaireconnexion! : FormGroup;
    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void { 
        this.initForm();
    }

    initForm(){
        this.formulaireconnexion = this.fb.group({
            email: ['', Validators.required],
            password: ['', Validators.required]
        })
    }

    
    async connexion () {
        try {
            console.log(this.formulaireconnexion.value);
            const userConnexion: UserConnexion = this.formulaireconnexion.value as UserConnexion;
            const resultat = await this.authService.connexion(userConnexion);
            console.log(resultat);
            this.router.navigateByUrl("");
        } catch (error) {
            console.log(error);
        }finally{
        }
    } 

    //fonction de mot de passe oublie l'utilisateur sera rediriger vers un formulaire ou il va renseigner son email
    onForgotPassword() {

}

}