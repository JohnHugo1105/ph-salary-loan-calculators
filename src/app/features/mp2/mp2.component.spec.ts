import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Mp2Component } from './mp2.component';

describe('Mp2Component', () => {
  let component: Mp2Component;
  let fixture: ComponentFixture<Mp2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mp2Component],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Mp2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
