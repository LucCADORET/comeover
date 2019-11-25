import { Component, OnInit } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';
import { ColorsService } from 'src/app/services/colors/colors.service';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {

  public defaultColors: string[];

  @Input() heading: string;
  @Input() color: string;
  @Output() event = new EventEmitter();
  public show = false;

  constructor(colorsService: ColorsService) {
    this.defaultColors = colorsService.getColors();
  }

  ngOnInit() {

  }

  public toggleColors() {
    this.show = !this.show;
  }

  /**
 * Change color from default colors
 * @param {string} color
 */
  public changeColor(color: string) {
    this.color = color;
    this.event.emit(this.color); // Return color
    this.show = false;
  }


  /**
   * Change color from input
   * @param {string} color
   */
  public changeColorManual(color: string) {
    const isValid = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);

    if (isValid) {
      this.color = color;
      this.event.emit(this.color); // Return color
    }
  }
}
