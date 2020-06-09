import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectModeModalComponent } from './select-mode-modal.component';

describe('SelectModeModalComponent', () => {
  let component: SelectModeModalComponent;
  let fixture: ComponentFixture<SelectModeModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectModeModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectModeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
