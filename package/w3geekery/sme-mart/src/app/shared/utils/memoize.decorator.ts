/**
 * Memoization decorator for caching method results based on input parameters.
 *
 * Adapted from ZB UI (zb-ui-lib/zerobias-services/utils/memoization.decorator.ts).
 * Caches by JSON-serialized args, with configurable TTL. Handles sync and async.
 * Doesn't cache errors. Exposes clearCache() on the decorated method.
 *
 * @param expirationTimeMs Cache TTL in ms (default: 60s)
 *
 * @example
 * ```ts
 * class MyService {
 *   @Memoize(30000) // 30s cache
 *   async getProject(id: string): Promise<Project> { ... }
 * }
 *
 * // Clear cache when data changes:
 * (myService.getProject as any).clearCache();
 * ```
 */
export function Memoize(expirationTimeMs: number = 60000) {
  return function (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { result: unknown; timestamp: number }>();

    descriptor.value = function (...args: unknown[]) {
      const key = JSON.stringify(args);
      const now = Date.now();

      const cached = cache.get(key);
      if (cached && (now - cached.timestamp) < expirationTimeMs) {
        return cached.result instanceof Promise ? cached.result : Promise.resolve(cached.result);
      }

      const result = originalMethod.apply(this, args);

      if (result && typeof result.then === 'function') {
        const promise = result.then((resolved: unknown) => {
          cache.set(key, { result: resolved, timestamp: Date.now() });
          return resolved;
        }).catch((error: unknown) => {
          cache.delete(key);
          throw error;
        });
        // Cache the promise itself to deduplicate concurrent calls
        cache.set(key, { result: promise, timestamp: now });
        return promise;
      } else {
        cache.set(key, { result, timestamp: now });
        return result;
      }
    };

    Object.defineProperty(descriptor.value, 'clearCache', {
      value: () => cache.clear(),
      writable: false,
      enumerable: false,
    });

    return descriptor;
  };
}

/** Cache indefinitely until manually cleared */
export function MemoizeIndefinitely() {
  return Memoize(Infinity);
}

/** 5-second cache for frequently called methods */
export function MemoizeShort() {
  return Memoize(5000);
}
