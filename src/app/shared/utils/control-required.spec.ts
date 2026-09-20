import { FormControl, Validators } from '@angular/forms';

import { isControlRequired } from './control-required';

describe('isControlRequired', () => {
  it('is true for required and requiredTrue controls', () => {
    expect(isControlRequired(new FormControl('', Validators.required))).toBe(true);
    expect(isControlRequired(new FormControl(false, Validators.requiredTrue))).toBe(true);
  });

  it('is false for other validators or no control', () => {
    expect(isControlRequired(new FormControl('', Validators.minLength(2)))).toBe(false);
    expect(isControlRequired(new FormControl(''))).toBe(false);
    expect(isControlRequired(null)).toBe(false);
    expect(isControlRequired(undefined)).toBe(false);
  });
});
