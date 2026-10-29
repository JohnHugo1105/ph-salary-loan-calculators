import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { SearchService } from './layout/search.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.setItem('cookie_consent', 'true');
    await TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter([])] }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set the title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect((fixture.componentInstance as any).title).toEqual('PH Salary & Loan Calculators');
  });

  it('renders the shell: skip link, header, main landmark and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.skip-link')).toBeTruthy();
    expect(el.querySelector('header.site-header')).toBeTruthy();
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector('footer.site-footer')).toBeTruthy();
    expect(el.textContent).toContain('Estimates only');
  });

  it('opens the search palette with Ctrl+K and with "/"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const search = TestBed.inject(SearchService);
    expect(search.isOpen()).toBeFalse();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(search.isOpen()).toBeTrue();
    search.close();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    expect(search.isOpen()).toBeTrue();
  });

  it('does not steal "/" while typing in a field', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    expect(TestBed.inject(SearchService).isOpen()).toBeFalse();
    input.remove();
  });
});
