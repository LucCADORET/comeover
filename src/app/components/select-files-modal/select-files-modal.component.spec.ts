import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFilesModalComponent } from './select-files-modal.component';

describe('SelectFilesModalComponent', () => {
  let component: SelectFilesModalComponent;
  let fixture: ComponentFixture<SelectFilesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectFilesModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFilesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
