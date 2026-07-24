import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FeatureComingSoonComponent } from './feature-coming-soon.component';

describe('FeatureComingSoonComponent', () => {
  let fixture: ComponentFixture<FeatureComingSoonComponent>;
  let component: FeatureComingSoonComponent;

  function setUp(routeData: Record<string, unknown>) {
    TestBed.configureTestingModule({
      imports: [FeatureComingSoonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of(routeData) } },
      ],
    });
    fixture = TestBed.createComponent(FeatureComingSoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setUp({ title: 'Test', description: 'D', featureKey: '999' });
    expect(component).toBeTruthy();
  });

  it('should expose coming-soon data from route.data via the signal', () => {
    setUp({
      title: 'Test Feature — Coming Soon',
      description: 'This is a test feature.',
      featureKey: '999',
    });

    const data = component.comingSoonData();
    expect(data).toBeDefined();
    expect(data?.title).toBe('Test Feature — Coming Soon');
    expect(data?.description).toBe('This is a test feature.');
    expect(data?.featureKey).toBe('999');
  });

  it('should render title and description in the template', () => {
    setUp({
      title: 'Test Feature — Coming Soon',
      description: 'This is a test feature.',
      featureKey: '999',
    });

    const titleEl = fixture.nativeElement.querySelector('.page-title');
    const descEl = fixture.nativeElement.querySelector('.page-description');
    expect(titleEl?.textContent).toContain('Test Feature — Coming Soon');
    expect(descEl?.textContent).toContain('This is a test feature.');
  });

  it('should apply fallback labels when route.data is empty', () => {
    setUp({});
    const data = component.comingSoonData();
    expect(data?.title).toBe('Coming Soon');
    expect(data?.description).toBe('This feature is on the roadmap.');
    expect(data?.featureKey).toBe('unknown');
  });
});
