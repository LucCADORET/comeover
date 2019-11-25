import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cinema-error-modal',
  templateUrl: './cinema-error-modal.component.html',
  styleUrls: ['./cinema-error-modal.component.scss']
})
export class CinemaErrorModalComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    ) { }

  ngOnInit() {
  }

  understood() {
    this.router.navigate(['/home']);
    this.activeModal.dismiss();
  }
}
