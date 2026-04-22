// ----------------------------------
// projects/saasy/apps/web/lib/auth/auth-data-cache.ts
//
// type CacheEntry                L24
// data                           L25
// timestamp                      L26
// isRefetching                   L27
// class AuthDataCache            L30
//   private cache                L31
//   private listeners            L32
//   private inFlightRequests     L33
//   get()                        L35
//   set()                        L39
//   setRefetching()              L49
//   clear()                      L57
//   getInFlightRequest()         L72
//   setInFlightRequest()         L76
//   removeInFlightRequest()      L80
//   subscribe()                  L84
//   private notify()            L101
// export const authDataCache    L113
// ----------------------------------

type CacheEntry<T> = {
  data: T | null;
  timestamp: number;
  isRefetching: boolean;
};

class AuthDataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private listeners = new Map<string, Set<() => void>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  set<T>(key: string, data: T | null) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      isRefetching: false,
    };
    this.cache.set(key, entry);
    this.notify(key);
  }

  setRefetching(key: string, isRefetching: boolean) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.isRefetching = isRefetching;
      this.notify(key);
    }
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.inFlightRequests.delete(key);
      this.notify(key);
    } else {
      this.cache.clear();
      this.inFlightRequests.clear();
      const keys = Array.from(this.listeners.keys());
      for (const key of keys) {
        this.notify(key);
      }
    }
  }

  getInFlightRequest<T>(key: string): Promise<T> | undefined {
    return this.inFlightRequests.get(key) as Promise<T> | undefined;
  }

  setInFlightRequest<T>(key: string, promise: Promise<T>) {
    this.inFlightRequests.set(key, promise);
  }

  removeInFlightRequest(key: string) {
    this.inFlightRequests.delete(key);
  }

  subscribe(key: string, callback: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  private notify(key: string) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      const callbackArray = Array.from(callbacks);
      for (const callback of callbackArray) {
        callback();
      }
    }
  }
}

// Global singleton instance
export const authDataCache = new AuthDataCache();
