import { Component, TemplateRef } from '@angular/core';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
    selector: 'app-toasts-container',
    templateUrl: './toasts-container.component.html',
    styleUrls: ['./toasts-container.component.scss'],
    standalone: false
})
export class ToastsContainerComponent {

  constructor(public toastService: ToastService) { }

  isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }
}
