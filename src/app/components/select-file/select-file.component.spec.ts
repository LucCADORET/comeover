import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectFileComponent } from './select-file.component';

describe('SelectFilesModalComponent', () => {
  let component: SelectFileComponent;
  let fixture: ComponentFixture<SelectFileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [SelectFileComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
