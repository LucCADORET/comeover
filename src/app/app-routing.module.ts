import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CinemaComponent } from './components/cinema/cinema.component';


const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'cinema', component: CinemaComponent },

    // Default redirection
    { path: '**', redirectTo: 'home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
