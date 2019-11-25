import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(duration: number): string {
    let milliseconds = Math.floor((duration % 1000) / 100);
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    let hoursStr = (hours < 10) ? "0" + hours : hours;
    let minutesStr = (minutes < 10) ? "0" + minutes : minutes;
    let secondsStr = (seconds < 10) ? "0" + seconds : seconds;

    return hoursStr + "h " + minutesStr + "m " + secondsStr + "s";
  }

}
