import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeResourceUrlPipe } from './safe-resource-url.pipe';

describe('SafeResourceUrlPipe', () => {
  let pipe: SafeResourceUrlPipe;
  let mockSanitizer: { bypassSecurityTrustResourceUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustResourceUrl: vi.fn().mockImplementation((url: string) => `trusted:${url}`),
    };

    TestBed.configureTestingModule({
      providers: [
        SafeResourceUrlPipe,
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    });

    pipe = TestBed.inject(SafeResourceUrlPipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should delegate to DomSanitizer.bypassSecurityTrustResourceUrl', () => {
    const url = 'https://example.com/doc.pdf';
    pipe.transform(url);
    expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(url);
  });

  it('should return the sanitized value', () => {
    const result = pipe.transform('https://example.com/doc.pdf');
    expect(result).toBe('trusted:https://example.com/doc.pdf');
  });
});
