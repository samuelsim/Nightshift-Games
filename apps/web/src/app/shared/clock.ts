import { DestroyRef, inject, signal } from '@angular/core';

export function useClock() {
  const now = signal(Date.now());
  const timer = setInterval(() => now.set(Date.now()), 250);
  inject(DestroyRef).onDestroy(() => clearInterval(timer));
  return now.asReadonly();
}
