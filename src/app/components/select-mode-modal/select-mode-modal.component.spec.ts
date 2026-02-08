import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectModeModalComponent } from './select-mode-modal.component';

describe('SelectModeModalComponent', () => {
  let component: SelectModeModalComponent;
  let fixture: ComponentFixture<SelectModeModalComponent>;

  beforeEach(waitForAsync(() => {
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
