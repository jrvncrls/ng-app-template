import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalService } from '../../core/services/modal/modal.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import {
  Autocomplete,
  AutocompleteOption,
} from '../../shared/components/autocomplete/autocomplete';
import { Badge, BadgeStatus } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Card } from '../../shared/components/card/card';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { InputText } from '../../shared/components/input-text/input-text';
import { Loader } from '../../shared/components/loader/loader';
import { Modal } from '../../shared/components/modal/modal';
import { MultiSelect, MultiSelectOption } from '../../shared/components/multi-select/multi-select';
import { Radio, RadioOption } from '../../shared/components/radio/radio';
import { Select, SelectOption } from '../../shared/components/select/select';
import { Tabs, TabItem } from '../../shared/components/tabs/tabs';
import { Textarea } from '../../shared/components/textarea/textarea';
import { Toggle } from '../../shared/components/toggle/toggle';
import { Tooltip } from '../../shared/components/tooltip/tooltip';
import { ShowcaseFormModal, ShowcaseFormResult } from './showcase-form-modal';

// Not a real feature — a living catalog of every shared/components/* element,
// each wired to something so its states (value, error, disabled, etc.) are
// actually visible. Route it in only under a dev-only path; never link to it
// from product navigation.
@Component({
  selector: 'app-component-showcase',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Autocomplete,
    Badge,
    Button,
    Card,
    Checkbox,
    InputText,
    Loader,
    Modal,
    MultiSelect,
    Radio,
    Select,
    Tabs,
    Textarea,
    Toggle,
    Tooltip,
  ],
  templateUrl: './component-showcase.html',
  styleUrl: './component-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentShowcase {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly modalService = inject(ModalService);

  protected readonly badgeStatuses: BadgeStatus[] = [
    'default',
    'active',
    'suspended',
    'declined',
    'completed',
  ];

  protected readonly selectOptions: SelectOption[] = [
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Blue', value: 'blue' },
  ];

  protected readonly multiSelectOptions: MultiSelectOption[] = [
    { label: 'Angular', value: 'angular' },
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte' },
  ];

  protected readonly autocompleteOptions: AutocompleteOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
  ];

  protected readonly radioOptions: RadioOption[] = [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ];

  protected readonly tabItems: TabItem[] = [
    { id: 'first', label: 'First tab' },
    { id: 'second', label: 'Second tab' },
    { id: 'third', label: 'Third tab' },
  ];

  protected readonly activeTabId = signal('first');

  protected readonly modalOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    bio: ['', Validators.maxLength(280)],
    color: [null as string | null, Validators.required],
    frameworks: [[] as string[], Validators.required],
    fruit: ['', Validators.required],
    size: [null as string | null, Validators.required],
    agreeToTerms: [false, Validators.requiredTrue],
    notifyMe: [false],
  });

  protected notifySuccess(): void {
    this.notify.success('Saved successfully.');
  }

  protected notifyError(): void {
    this.notify.error('Something went wrong.');
  }

  protected notifyWarning(): void {
    this.notify.warning('Please double-check this.', { position: 'bottom' });
  }

  protected notifyInfo(): void {
    this.notify.info('Here is some information.', { position: 'bottom' });
  }

  protected submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.notify.success('Form submitted.');
    }
  }

  protected openServiceModal(): void {
    this.modalService
      .open<ShowcaseFormModal, ShowcaseFormResult>(ShowcaseFormModal, {
        title: 'Edit profile (service-driven, stacked)',
        testId: 'showcase-service-modal',
      })
      .afterClosed()
      .then((result) => {
        if (result) {
          this.notify.success(`Saved "${result.name}" via ModalService.`);
        }
      });
  }
}
