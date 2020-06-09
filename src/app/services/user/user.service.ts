import { Injectable } from '@angular/core';
import * as uuidv4 from 'uuid/v4';
import { ColorsService } from '../colors/colors.service';
import * as randomUsernameGenerator from 'random-username-generator';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userId: string;
  private username: string;
  private color: string;
  private isCreator: boolean = false; // Creator of the room
  private isLive: boolean = false; // Is the live stream caster

  constructor(colorsService: ColorsService) {

    this.userId = localStorage.getItem("user_userId");
    if (!this.userId) this.setUserId(uuidv4());

    this.color = localStorage.getItem("user_color");
    if (!this.color) this.setColor(colorsService.getRandomColor());

    this.username = localStorage.getItem("user_username");
    if (!this.username) this.setUsername(randomUsernameGenerator.generate());
  }

  public setIsCreator() {
    this.isCreator = true;
  }

  public getUserId(): string {
    return this.userId;
  }

  public isUserCreator(): boolean {
    return this.isCreator;
  }
  
  public getUsername(): string {
    return this.username;
  }

  public getColor(): string {
    return this.color;
  }

  private setUserId(uuid: string) {
    this.userId = uuid;
    localStorage.setItem("user_userId", this.userId);
  }

  public setUsername(username: string) {
    this.username = username;
    localStorage.setItem("user_username", this.username);
  }

  public setColor(color: string) {
    this.color = color;
    localStorage.setItem("user_color", this.color);
  }
}
