import { TestBed } from '@angular/core/testing';

import { ZerobiasAppService } from './zerobias-app.service';

describe('ZerobiasAppService', () => {
  let service: ZerobiasAppService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZerobiasAppService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
