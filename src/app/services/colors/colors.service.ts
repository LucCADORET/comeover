import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorsService {

  // public defaultColors: string[] = [
  //   '#ffffff',
  //   '#000105',
  //   '#3e6158',
  //   '#3f7a89',
  //   '#96c582',
  //   '#b7d5c4',
  //   '#bcd6e7',
  //   '#7c90c1',
  //   '#9d8594',
  //   '#dad0d8',
  //   '#4b4fce',
  //   '#4e0a77',
  //   '#a367b5',
  //   '#ee3e6d',
  //   '#d63d62',
  //   '#c6a670',
  //   '#f46600',
  //   '#cf0500',
  //   '#efabbd',
  //   '#8e0622',
  //   '#f0b89a',
  //   '#f0ca68',
  //   '#62382f',
  //   '#c97545',
  //   '#c1800b'
  // ];


  public colors: string[] = [
    '#1ABC9C',
    '#11806A',
    '#2ECC71',
    '#1F8B4C',
    '#3498DB',
    '#206694',
    '#9B59B6',
    '#71368A',
    '#E91E63',
    '#AD1457',
    '#F1C40F',
    '#C27C0E',
    '#E67E22',
    '#E74C3C',
    '#992D22',
    '#95A5A6',
    '#607D8B',
  ];

  constructor() { }

  getColors(): string[] {
    return this.colors;
  }

  getRandomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }
}
