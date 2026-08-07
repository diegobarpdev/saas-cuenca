import { sileo } from 'sileo';

interface ToastOptions {
  description?: string;
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sileo.success({
      title: message,
      description: options?.description,
      duration: options?.duration,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return sileo.error({
      title: message,
      description: options?.description,
      duration: options?.duration,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return sileo.info({
      title: message,
      description: options?.description,
      duration: options?.duration,
    });
  },
  warning: (message: string, options?: ToastOptions) => {
    return sileo.warning({
      title: message,
      description: options?.description,
      duration: options?.duration,
    });
  },
  dismiss: (id?: string) => {
    if (id) {
      sileo.dismiss(id);
    }
  }
};
