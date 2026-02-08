import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CinemaComponent } from './cinema.component';

describe('CinemaComponent', () => {
  let component: CinemaComponent;
  let fixture: ComponentFixture<CinemaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CinemaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CinemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
