import { TestBed } from '@angular/core/testing';

import { User.ContextService } from './user.context.service';

describe('User.ContextService', () => {
  let service: User.ContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(User.ContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
