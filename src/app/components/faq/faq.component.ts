import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss'],
    imports: [RouterLink]
})
export class FaqComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
