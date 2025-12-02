import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null;

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=/\[\]\\]/.test(value);

    const valid = hasUpper && hasLower && hasSpecial;

    return valid
      ? null
      : {
          passwordStrength: {
            hasUpper,
            hasLower,
            hasSpecial,
          },
        };
  };
}
