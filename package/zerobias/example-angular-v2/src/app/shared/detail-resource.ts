import { computed, inject, resource, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import type { ZerobiasClientApi } from '@zerobias-com/zerobias-client';

import { SessionService } from '../core/session.service';

/** The three reactive views every drill-down page renders. `value()` is already error-safe. */
export interface DetailResource<T> {
  /** The loaded payload, or `undefined` while loading, before an id exists, or on error. */
  readonly value: Signal<T | undefined>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
}

/** User-facing copy for the two non-happy states. */
export interface DetailMessages {
  /** Shown when the route carries no `id` query param. */
  missingId: string;
  /** Shown when the loader rejects. */
  loadFailed: string;
}

/**
 * Wires the `id`-query-param -> `resource()` -> derived-state pattern shared by every drill-down
 * detail page (project / board / task). The loader is handed the live SDK handle plus the resolved
 * id; the resource auto-cancels via `AbortSignal` on id change or destroy, so there is no manual
 * teardown, no `loading`/`error` flags, and no `ngOnInit`.
 *
 * The returned `value()` is read behind `hasValue()` on purpose: a resource's own `value()` THROWS
 * in the error state, so callers get a safe `T | undefined` instead and can `?.`-chain freely.
 *
 * MUST be called from an injection context (a field initializer or the constructor).
 */
export function detailResource<T>(
  loader: (ctx: { api: ZerobiasClientApi; id: string }) => Promise<T>,
  messages: DetailMessages,
): DetailResource<T> {
  const session = inject(SessionService);
  const route = inject(ActivatedRoute);

  const idParam = toSignal(
    route.queryParamMap.pipe(map((q) => q.get('id'))),
    { initialValue: route.snapshot.queryParamMap.get('id') },
  );

  const res = resource({
    params: () => {
      const api = session.api();
      const id = idParam();
      return api && id ? { api, id } : undefined;
    },
    loader: ({ params }) => loader(params),
  });

  return {
    value: computed(() => (res.hasValue() ? res.value() : undefined)),
    loading: computed(() => res.isLoading()),
    error: computed(() => {
      if (!idParam()) return messages.missingId;
      return res.error() ? messages.loadFailed : null;
    }),
  };
}
