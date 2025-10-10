import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../pages/auth/auth.service';


@Directive({
    standalone: true,
    selector: '[canSee]',
})
export class CanSeeDirective {
    @Input({required: true}) set canSee(roles: string[]){
        if(this.hasOneRole(roles)){
            this.ViewContainerRef.createEmbeddedView(this.templateRef);
        }else{
            this.ViewContainerRef.clear();
        }
    }

    constructor(
        private templateRef: TemplateRef<any>, 
        private ViewContainerRef: ViewContainerRef,
        private authService: AuthService,
    ) {}

    hasOneRole(roles: string[]): boolean{
        const userRole = this.authService.rolesNames();        
        let contain = undefined;
        for (let i = 0; i < roles.length; i++) {
            contain = userRole.find(r => r==roles[i]);
            if(contain) return true;
        }
        return false;
    }
}