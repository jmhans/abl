import { TestBed } from '@angular/core/testing';

import { CloneService } from './clone.service';

describe('CloneService', () => {
  let service: CloneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
