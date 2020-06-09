import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModesEnum } from '../../enums/modesEnum';
import { SelectModeResult } from '../../models/selectModeResult';

@Component({
  selector: 'app-select-mode-modal',
  templateUrl: './select-mode-modal.component.html',
  styleUrls: ['./select-mode-modal.component.scss']
})
export class SelectModeModalComponent implements OnInit {

  modesEnum = ModesEnum;
  selectedMode: ModesEnum;

  constructor(
    public activeModal: NgbActiveModal,
  ) {

  }

  ngOnInit() {
  }

  selectMode(mode: ModesEnum) {
    this.selectedMode = mode;
  }

  unselectMode() {
    this.selectedMode = null;
  }


  onFiles(files: Array<File>) {
    let result = new SelectModeResult(ModesEnum.FILE, files);
    this.closeWithResult(result);
  }

  onSource(source: MediaStream) {
    let result = new SelectModeResult(ModesEnum.LIVE, source);
    this.closeWithResult(result);
  }

  closeWithResult(result: SelectModeResult) {
    this.activeModal.close(result);
  }
}
