import { AbstractControl, Validators } from '@angular/forms';

/** True when the control carries `Validators.required` / `Validators.requiredTrue`. */
export function isControlRequired(control: AbstractControl | null | undefined): boolean {
  return (
    !!control &&
    (control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue))
  );
}
