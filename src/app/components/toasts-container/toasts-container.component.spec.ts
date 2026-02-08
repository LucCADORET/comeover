import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ToastsContainerComponent } from './toasts-container.component';

describe('ToastsContainerComponent', () => {
  let component: ToastsContainerComponent;
  let fixture: ComponentFixture<ToastsContainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [ToastsContainerComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToastsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
