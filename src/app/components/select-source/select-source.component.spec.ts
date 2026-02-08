import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectSourceComponent } from './select-source.component';

describe('SelectSourceComponent', () => {
  let component: SelectSourceComponent;
  let fixture: ComponentFixture<SelectSourceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [SelectSourceComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
