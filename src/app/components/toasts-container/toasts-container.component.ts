import { Component, TemplateRef } from '@angular/core';
import { ToastService } from 'src/app/services/toast/toast.service';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-toasts-container',
    templateUrl: './toasts-container.component.html',
    styleUrls: ['./toasts-container.component.scss'],
    imports: [NgbToast, NgTemplateOutlet]
})
export class ToastsContainerComponent {

  constructor(public toastService: ToastService) { }

  isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }
}
