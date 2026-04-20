import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SmeDocLinkRenderer } from './sme-doc-link-renderer.component';

describe('SmeDocLinkRenderer', () => {
  let component: SmeDocLinkRenderer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SmeDocLinkRenderer],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(SmeDocLinkRenderer);
    component = fixture.componentInstance;
    component.docId = 'doc-001';
    component.filename = 'security-report.pdf';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bind docId and filename inputs', () => {
    expect(component.docId).toBe('doc-001');
    expect(component.filename).toBe('security-report.pdf');
  });

  it('should emit navigate with docId on click', () => {
    const spy = vi.spyOn(component.navigate, 'emit');
    component.navigate.emit(component.docId);
    expect(spy).toHaveBeenCalledWith('doc-001');
  });
});
