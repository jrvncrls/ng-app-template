import { ConnectedPosition } from '@angular/cdk/overlay';

// Shared by every dropdown-panel component (`select`, `multi-select`,
// `autocomplete`): prefer opening below the trigger, and let the CDK flip the
// panel above it when there isn't room below.
export const DROPDOWN_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];
