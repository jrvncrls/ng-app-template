import { TestBed } from '@angular/core/testing';

import { AuthRefreshCoordinatorService } from './auth-refresh-coordinator.service';

describe('AuthRefreshCoordinatorService', () => {
  let service: AuthRefreshCoordinatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthRefreshCoordinatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
