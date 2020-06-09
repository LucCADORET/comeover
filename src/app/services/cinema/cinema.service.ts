import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CinemaService {

  filesToSeed: File[];
  magnet: string;

  constructor() { }
}
