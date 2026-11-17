export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: unknown;
};

export const success = <T>(message: string, data: T): ApiSuccess<T> => ({
  success: true,
  message,
  data
});

export const failure = (message: string, errors?: unknown): ApiError => ({
  success: false,
  message,
  errors
});
