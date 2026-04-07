import { AbstractControl } from "@angular/forms";

export const passwordMatchVlidator = (control: AbstractControl) => {
  return control.get('password')?.value === control.get('rePassword')?.value
    ? null
    : { mismatch: true };
}