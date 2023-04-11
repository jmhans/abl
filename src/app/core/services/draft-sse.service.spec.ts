import { TestBed } from '@angular/core/testing';

import { DraftSseService } from './draft-sse.service';

describe('DraftSseService', () => {
  let service: DraftSseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DraftSseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
