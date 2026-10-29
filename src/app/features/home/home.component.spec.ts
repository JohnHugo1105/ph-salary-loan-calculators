import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TOOLS, TOOL_GROUPS } from '../../core/config/tools';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists every calculator under its category', () => {
    for (const g of TOOL_GROUPS) expect(el().textContent).toContain(g.title);
    for (const t of TOOLS) expect(el().textContent).toContain(t.title);
  });

  it('has one h1', () => {
    expect(el().querySelectorAll('h1').length).toBe(1);
  });

  it('shows a worked example from the engine', () => {
    expect(component.example.rows[component.example.rows.length - 1].amount).toBe(26_542.45);
    expect(el().textContent).toContain('₱26,542.45');
  });

  it('filters tools as you search and can be cleared', () => {
    component.onSearch('maternity');
    fixture.detectChanges();
    expect(el().textContent).toContain('1 result');
    expect(el().querySelectorAll('app-tool-card').length).toBe(1);
    expect(el().textContent).not.toContain('Why you can trust');
    component.onSearch('');
    fixture.detectChanges();
    expect(el().textContent).toContain('Why you can trust');
  });

  it('says so when nothing matches', () => {
    component.onSearch('zzzz');
    fixture.detectChanges();
    expect(el().textContent).toContain('0 results');
    expect(el().textContent).toContain('Nothing matched');
  });
});
