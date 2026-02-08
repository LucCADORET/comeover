import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-select-source',
    templateUrl: './select-source.component.html',
    styleUrls: ['./select-source.component.scss']
})
export class SelectSourceComponent implements OnInit {

  @Output() source: EventEmitter<MediaStream>;

  constructor() {
    this.source = new EventEmitter<MediaStream>();
  }

  ngOnInit() {
  }

  selectSource() {
    let displayMediaOptions = {
      video: true,
      audio: true
    };
    const mediaDevices = navigator.mediaDevices as any; // Workaround for typescript warning

    // Capture the user media
    mediaDevices.getDisplayMedia(displayMediaOptions).then((ms: MediaStream) => {
      this.source.emit(ms);
    });
  }
}
