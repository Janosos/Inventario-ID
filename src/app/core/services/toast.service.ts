import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  show(title: string, options?: { type?: ToastType; description?: string; duration?: number }): string {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = {
      id,
      title,
      type: options?.type || 'info',
      description: options?.description,
      duration: options?.duration ?? 3800,
      timestamp: Date.now()
    };

    this.toasts.update(list => [...list, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }

    return id;
  }

  success(title: string, description?: string): string {
    return this.show(title, { type: 'success', description });
  }

  error(title: string, description?: string): string {
    return this.show(title, { type: 'error', description, duration: 5000 });
  }

  warning(title: string, description?: string): string {
    return this.show(title, { type: 'warning', description });
  }

  info(title: string, description?: string): string {
    return this.show(title, { type: 'info', description });
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
