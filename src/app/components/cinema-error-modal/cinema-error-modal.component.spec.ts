import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CinemaErrorModalComponent } from './cinema-error-modal.component';

describe('CinemaErrorModalComponent', () => {
  let component: CinemaErrorModalComponent;
  let fixture: ComponentFixture<CinemaErrorModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CinemaErrorModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CinemaErrorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
