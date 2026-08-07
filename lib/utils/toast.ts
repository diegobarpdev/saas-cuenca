type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

type Subscriber = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let subscribers: Subscriber[] = [];

const notify = () => {
  subscribers.forEach((sub) => sub([...toasts]));
};

export const toastStore = {
  subscribe: (sub: Subscriber) => {
    subscribers.push(sub);
    sub(toasts);
    return () => {
      subscribers = subscribers.filter((s) => s !== sub);
    };
  },
  add: (message: string, type: ToastType, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 3500;
    
    toasts = [...toasts, { id, message, description: options?.description, type }];
    notify();

    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, duration);

    return id;
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }
};

export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) => {
    return toastStore.add(message, 'success', options);
  },
  error: (message: string, options?: { description?: string; duration?: number }) => {
    return toastStore.add(message, 'error', options);
  },
  info: (message: string, options?: { description?: string; duration?: number }) => {
    return toastStore.add(message, 'info', options);
  },
  warning: (message: string, options?: { description?: string; duration?: number }) => {
    return toastStore.add(message, 'warning', options);
  },
  dismiss: (id?: string) => {
    if (id) {
      toastStore.dismiss(id);
    }
  }
};
