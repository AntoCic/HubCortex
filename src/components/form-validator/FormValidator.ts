// src/components/form-validator/FormValidator.ts
import { reactive, computed, type ComputedRef, watch, type Ref, isRef } from 'vue'
import { clone } from '../clone/clone'

export type RuleFn<V> = (value: V) => string | null

export type Schema<T> = { [K in keyof T]?: RuleFn<T[K]>[] }

type ErrorsOf<T> = { [K in keyof T]: string | null }
type TouchedOf<T> = { [K in keyof T]: boolean }

export interface FormValidatorOptions<T extends Record<string, any>> {
  id?: string
  initialValues: T
  validator?: Schema<T>
  onSubmit?: (values: Readonly<T>, touchedValues: Partial<T>, touched: Readonly<TouchedOf<T>>) => void | Promise<void>
  onInvalid?: (errors: Readonly<ErrorsOf<T>>) => void
  /** Validazione on change (default: true per tutti) */
  validateOnChange?: boolean | Partial<Record<keyof T, boolean>>
  /** Validazione on change (default: true per tutti) */
  touchOnChange?: boolean | Partial<Record<keyof T, boolean>>

  syncWith?: Ref<Partial<T> | null | undefined> | (() => Partial<T> | null | undefined)
  submitOnChange?: boolean | number
  syncPreference?: 'local' | 'db'

  effects?: Partial<Record<keyof T, (value: T[keyof T], fv: FormValidator<T>) => void>>
  onAnyChange?: (key: keyof T, value: T[keyof T], fv: FormValidator<T>) => void
}

export class FormValidator<T extends Record<string, any>> {
  readonly id: string
  readonly values: T
  readonly errors: ErrorsOf<T>
  readonly touched: TouchedOf<T>
  private _initial: T
  private readonly schema: Schema<T>
  private readonly _onSubmit?: (values: Readonly<T>, touchedValues: Partial<T>, touched: Readonly<TouchedOf<T>>) => void | Promise<void>
  private readonly _onInvalid?: (errors: Readonly<ErrorsOf<T>>) => void
  private readonly _validateOnChangeMap: Partial<Record<keyof T, boolean>>
  private readonly _touchOnChangeMap: Partial<Record<keyof T, boolean>>
  private readonly _stopWatch?: () => void
  private _fieldCache: { [K in keyof T]?: ComputedRef<T[K]> } = {}
  private _allFields?: { [K in keyof T]: ComputedRef<T[K]> }
  private _submitOnChange?: boolean | number
  private _suspendAutoSubmit = false
  private _debouncedSubmit?: () => void
  private _syncPreference: 'local' | 'db'
  private readonly _effects?: Partial<Record<keyof T, (value: T[keyof T], fv: FormValidator<T>) => void>>
  private readonly _onAnyChange?: (key: keyof T, value: T[keyof T], fv: FormValidator<T>) => void

  private _makeDebouncedSubmit(delay: number) {
    let t: number | undefined
    return () => {
      if (t) clearTimeout(t)
      t = window.setTimeout(() => {
        if (!this._suspendAutoSubmit) void this.submit()
      }, delay)
    }
  }

  constructor(options: FormValidatorOptions<T>)
  constructor(initial: T, schema?: Schema<T>)
  constructor(a: T | FormValidatorOptions<T>, b?: Schema<T>) {
    this.id = a.id ?? ''
    const isOptions = (x: any): x is FormValidatorOptions<T> => 'initialValues' in x

    this._syncPreference = isOptions(a) && a.syncPreference ? a.syncPreference : 'db'

    const initial = (isOptions(a) ? a.initialValues : a) as T

    const keys = Object.keys(initial) as (keyof T)[]

    const buildBoolMap = (
      opt: boolean | Partial<Record<keyof T, boolean>> | undefined,
      defaultAll: boolean
    ): Partial<Record<keyof T, boolean>> => {
      const m: Partial<Record<keyof T, boolean>> = {}
      // default per tutti i campi
      for (const k of keys) m[k] = defaultAll
      if (typeof opt === 'boolean') {
        for (const k of keys) m[k] = opt
      } else if (opt && typeof opt === 'object') {
        Object.assign(m, opt) // override per-chiave
      }
      return m
    }

    const schema = (isOptions(a) ? a.validator : b) ?? {}
    const onSubmit = isOptions(a) ? a.onSubmit : undefined
    const onInvalid = isOptions(a) ? a.onInvalid : undefined
    const validateOnChange = isOptions(a) ? a.validateOnChange : undefined
    const touchOnChange = isOptions(a) ? (a as any).touchOnChange : undefined
    this._validateOnChangeMap = buildBoolMap(validateOnChange, true)
    this._touchOnChangeMap = buildBoolMap(touchOnChange, true)

    const syncWith = isOptions(a) ? a.syncWith : undefined

    this._initial = clone(initial)
    this.values = reactive(clone(initial)) as T

    this.errors = reactive(
      Object.keys(initial).reduce((acc, k) => {
        (acc as any)[k] = null
        return acc
      }, {} as ErrorsOf<T>)
    ) as ErrorsOf<T>

    this.touched = reactive(
      Object.keys(initial).reduce((acc, k) => {
        (acc as any)[k] = false
        return acc
      }, {} as TouchedOf<T>)
    ) as TouchedOf<T>

    this.schema = schema
    this._onSubmit = onSubmit
    this._onInvalid = onInvalid

    this._submitOnChange = isOptions(a) ? a.submitOnChange : undefined
    this._effects = isOptions(a) ? a.effects : undefined
    this._onAnyChange = isOptions(a) ? a.onAnyChange : undefined

    if (typeof this._submitOnChange === 'number' && this._submitOnChange >= 0) {
      this._debouncedSubmit = this._makeDebouncedSubmit(this._submitOnChange)
    }

    if (syncWith) {
      if (isRef(syncWith)) {
        this._stopWatch = watch(syncWith, (val) => { if (val) this.fill(val) }, { immediate: true })
      } else if (typeof syncWith === 'function') {
        this._stopWatch = watch(syncWith, (val) => { if (val) this.fill(val) }, { immediate: true })
      }
    }

  }

  touch<K extends keyof T>(key: K) { this.touched[key] = true }

  touchAll() {
    for (const k of Object.keys(this.touched) as (keyof T)[]) this.touched[k] = true
  }

  field<K extends keyof T>(key: K): ComputedRef<T[K]> {
    const cached = this._fieldCache[key]
    if (cached) return cached
    const c = computed<T[K]>({
      get: () => this.values[key],
      set: (v) => this.set(key, v),
    })
    this._fieldCache[key] = c
    return c
  }

  fields(): { [K in keyof T]: ComputedRef<T[K]> } {
    if (!this._allFields) {
      const m = {} as { [K in keyof T]: ComputedRef<T[K]> }
      for (const k of Object.keys(this.values) as (keyof T)[]) m[k] = this.field(k)
      this._allFields = m
    }
    return this._allFields
  }

  set<K extends keyof T>(key: K, value: T[K], validateNow?: boolean) {
    this.values[key] = value

    if (!this.touched[key] && (this._touchOnChangeMap[key] ?? false)) {
      this.touched[key] = true
    }
    const shouldValidate = validateNow ?? !!this._validateOnChangeMap[key]
    if (shouldValidate) this.validateField(key)

    this._effects?.[key]?.(value, this)
    this._onAnyChange?.(key, value, this)

    if (!this._suspendAutoSubmit && this._submitOnChange) {
      if (this._submitOnChange === true) {
        void this.submit()
      } else if (typeof this._submitOnChange === 'number') {
        this._debouncedSubmit?.()
      }
    }
  }

  validateField<K extends keyof T>(key: K): boolean {
    const rules = this.schema[key] ?? []
    for (const rule of rules) {
      const res = rule(this.values[key])
      this.errors[key] = res
      if (res) return false
    }
    this.errors[key] = null
    return true
  }

  validateAll(): boolean {
    let ok = true
    for (const k of Object.keys(this.values) as (keyof T)[]) {
      if (!this.validateField(k)) {
        this.touch(k);
        ok = false;
      }
    }
    return ok
  }

  fill(model: Partial<T>, options?: { validate: boolean }) {
    let { validate } = options ?? {}
    if (validate === undefined) { validate = false }
    this._suspendAutoSubmit = true
    try {
      for (const k in model) {
        if (!(k in this.values)) continue
        const key = k as keyof T
        if (this._syncPreference === 'local' && this.touched[key]) {
          continue
        }

        (this.values as any)[key] = (model as any)[key]
      }
      if (validate) this.validateAll()
    } finally {
      this._suspendAutoSubmit = false
    }
  }

  reset({ keepTouched = false }: { keepTouched?: boolean } = {}) {
    for (const k of Object.keys(this._initial) as (keyof T)[]) {
      this.values[k] = this._initial[k]
    }
    for (const k of Object.keys(this.errors) as (keyof T)[]) {
      this.errors[k] = null
    }
    if (!keepTouched) {
      for (const k of Object.keys(this.touched) as (keyof T)[]) {
        this.touched[k] = false
      }
    }
  }

  resetWithInitialValues(initialValues: T) {
    this._initial = clone(initialValues)
    this.reset();
  }

  bindField<K extends keyof T>(key: K, forceValidateOnChange?: boolean): ComputedRef<T[K]> {
    return computed<T[K]>({
      get: () => this.values[key],
      set: (v) => this.set(
        key,
        v,
        forceValidateOnChange ?? this._validateOnChangeMap[key] ?? false
      ),
    })
  }

  showError<K extends keyof T>(key: K): string | null {
    return this.touched[key] ? this.errors[key] : null
  }
  hasError(k: keyof T) { return !!this.showError(k) }

  getFieldId<K extends keyof T>(key: K) {
    return `${this.id !== '' ? this.id + '_' : ''}field_${String(key)}`;
  }
  getFieldIdError<K extends keyof T>(key: K) {
    return `${this.getFieldId(key)}-error`;
  }

  getFieldProps<K extends keyof T>(key: K) {
    return {
      id: this.getFieldId(key),
      'aria-invalid': this.hasError(key),
      'aria-describedby': this.getFieldIdError(key),
      class: { 'is-invalid': !!this.showError(key) },
    }
  }

  get isValid(): boolean { return Object.values(this.errors).every(e => e == null) }
  get isDirty(): boolean {
    return JSON.stringify(this.values) !== JSON.stringify(this._initial)
  }
  get touchedValues(): Partial<T> {
    const touchedValues = {} as Partial<T>
    for (const k of Object.keys(this.values) as (keyof T)[]) {
      if (this.touched[k]) (touchedValues as any)[k] = this.values[k]
    }
    return touchedValues
  }

  dispose() {
    this._stopWatch?.()
  }

  /** Handler pronto per il form: @submit.prevent="fv.submit" */
  submit = async () => {
    const ok = this.validateAll()
    if (!ok) {
      this._onInvalid?.(this.errors)
      return
    }

    await this._onSubmit?.(this.values, this.touchedValues, this.touched)
  }

  setSyncPreference(pref: 'local' | 'db') {
    this._syncPreference = pref
  }
}
