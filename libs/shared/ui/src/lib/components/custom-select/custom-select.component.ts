import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  forwardRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CustomSelectValue = string | number | boolean | null;

export interface CustomSelectOption {
  value: CustomSelectValue;
  label: string;
  description?: string | null;
  icon?: string | null;
  disabled?: boolean;
}

@Component({
  selector: 'lib-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef<HTMLElement>);

  private optionsState = signal<CustomSelectOption[]>([]);
  private valueState = signal<CustomSelectValue>(null);
  readonly isOpen = signal(false);

  @Input() id = `custom-select-${Math.random().toString(36).slice(2, 9)}`;
  @Input() label = '';
  @Input() placeholder = 'Chọn';
  @Input() helperText = '';
  @Input() icon = 'bi-chevron-expand';
  @Input() disabled = false;

  @Input()
  set options(value: CustomSelectOption[] | null | undefined) {
    this.optionsState.set(value ?? []);
  }
  get options(): CustomSelectOption[] {
    return this.optionsState();
  }

  @Input()
  set value(value: CustomSelectValue) {
    this.writeValue(value);
  }
  get value(): CustomSelectValue {
    return this.valueState();
  }

  @Output() valueChange = new EventEmitter<CustomSelectValue>();

  readonly selectedOption = computed(
    () => this.optionsState().find((option) => this.isSameValue(option.value, this.valueState())) ?? null,
  );

  readonly displayLabel = computed(() => this.selectedOption()?.label ?? this.placeholder);

  private onChange: (value: CustomSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: CustomSelectValue): void {
    this.valueState.set(value ?? null);
  }

  registerOnChange(fn: (value: CustomSelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }

    this.isOpen.update((current) => !current);
    this.onTouched();
  }

  open(): void {
    if (!this.disabled) {
      this.isOpen.set(true);
      this.onTouched();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(option: CustomSelectOption): void {
    if (this.disabled || option.disabled) {
      return;
    }

    this.valueState.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.onTouched();
    this.isOpen.set(false);
  }

  isSelected(option: CustomSelectOption): boolean {
    return this.isSameValue(option.value, this.valueState());
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
    }
  }

  onOptionKeydown(event: KeyboardEvent, option: CustomSelectOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(option);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private isSameValue(left: CustomSelectValue, right: CustomSelectValue): boolean {
    return Object.is(left, right);
  }
}
