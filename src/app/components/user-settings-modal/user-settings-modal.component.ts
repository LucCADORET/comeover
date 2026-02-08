import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/services/user/user.service';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from '../color-picker/color-picker.component';

@Component({
    selector: 'app-user-settings-modal',
    templateUrl: './user-settings-modal.component.html',
    styleUrls: ['./user-settings-modal.component.scss'],
    imports: [FormsModule, ColorPickerComponent]
})
export class UserSettingsModalComponent implements OnInit {

  username: string;
  color: string;

  constructor(
    public activeModal: NgbActiveModal,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.username = this.userService.getUsername();
    this.color = this.userService.getColor();
  }

  validate() {
    this.userService.setUsername(this.username);
    this.userService.setColor(this.color);
    this.activeModal.close();
  }

  /**
   * Set color from color picker
   * @param {string} type
   * @param {string} color
   */
  public setColor(color: string) {
    this.color = color;
  }
}
