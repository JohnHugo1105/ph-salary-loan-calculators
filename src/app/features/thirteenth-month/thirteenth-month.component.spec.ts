import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirteenthMonthComponent } from './thirteenth-month.component';

describe('ThirteenthMonthComponent', () => {
  let component: ThirteenthMonthComponent;
  let fixture: ComponentFixture<ThirteenthMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirteenthMonthComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThirteenthMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
