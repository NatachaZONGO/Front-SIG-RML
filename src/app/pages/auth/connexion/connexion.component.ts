
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserConnexion } from './userconnexion.model';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-connexion',
    templateUrl: './connexion.component.html',
    standalone: true,
    providers: [AuthService, MessageService],
    imports: [
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        ReactiveFormsModule,
        CommonModule,
        ToastModule,
    ]
})
export class ConnexionComponent implements OnInit {
    formulaireconnexion! : FormGroup;
    messageErreur: string = "";
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
            this.router.navigateByUrl("/landing");
        } catch (error) {
            console.log("Erreur de connexion :", error);
            this.messageErreur = "Email ou mot de passe incorrect. Veuillez réessayer.";
        }finally{
        }
    } 

    //fonction de mot de passe oublie l'utilisateur sera rediriger vers un formulaire ou il va renseigner son email
    onForgotPassword() {
}
    
    //fonction pour rediriger l'utilisateur vers la page d'inscription
    navigateToRegister() {
        this.router.navigateByUrl("/register");
    }

}