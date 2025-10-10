
import {
     AbstractControl, 
     ValidationErrors, 
     ValidatorFn } from '@angular/forms';
     
export function matchValidator (matchTo: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        return control.parent && control.parent.get(matchTo)?.value === control.value ?
            null : { notMatching : true }
    }
}
