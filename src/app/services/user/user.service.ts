import { Injectable } from '@angular/core';
import * as uuidv4 from 'uuid/v4';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userId: string;
  private isCreator: boolean = false;

  constructor() {
    this.userId = uuidv4();
  }

  public setIsCreator() {
    this.isCreator = true;
  }

  public getUserId(): string {
    return this.userId;
  }

  public isUserCreator():boolean {
    return this.isCreator;
  }
}
