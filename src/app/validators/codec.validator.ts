import { AbstractControl } from '@angular/forms';
import { isCodecSupported } from '../utils/utils';

export function codecValidator(control: AbstractControl) {
    if (!control.value || !isCodecSupported(control.value.codec)) {
        return { invalidCodec: true };
    }
    return null;
}