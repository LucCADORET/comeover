import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { CinemaComponent } from '../components/cinema/cinema.component';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuard implements CanDeactivate<CinemaComponent> {
  canDeactivate(
    component: CinemaComponent,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // If nothing was downloaded, allow to exit without message
    if(component.progress == 0) return true;

    // Otherwise just ask the permission to exit
    let message = "";
    if (component.isCreator) {
      message = 'Are you sure you want to exit the room ? You are the creator of the room, it will stop the file seeding, and the synchronization between the viewers.';
    } else {
      message = 'Are you sure you want to exit the room ?';
    }
    return confirm(message);
  }
}
