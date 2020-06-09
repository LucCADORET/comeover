import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CinemaComponent } from './components/cinema/cinema.component';
import { FaqComponent } from './components/faq/faq.component';
import { DonateComponent } from './components/donate/donate.component';
import { CanDeactivateGuard } from './guards/can-deactivate.guard';
import { LiveComponent } from './components/live/live.component';

const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'faq', component: FaqComponent },
    { path: 'donate', component: DonateComponent },
    { path: 'cinema/:channelId', component: CinemaComponent, canDeactivate: [CanDeactivateGuard] },
    { path: 'live/:channelId', component: LiveComponent, canDeactivate: [CanDeactivateGuard] },

    // Default redirection
    { path: '**', redirectTo: 'home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
