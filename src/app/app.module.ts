import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CinemaComponent } from './components/cinema/cinema.component';
import { HomeComponent } from './components/home/home.component';
import { SelectFilesModalComponent } from './components/select-files-modal/select-files-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    CinemaComponent,
    HomeComponent,
    SelectFilesModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [SelectFilesModalComponent]
})
export class AppModule { }
