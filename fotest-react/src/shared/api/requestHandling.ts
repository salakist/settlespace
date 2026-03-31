type HttpError = {
  response?: {
    status?: number;
  };
};

type RequestErrorOptions = {
  error: unknown;
  onUnauthorized: () => void;
  setError: (message: string) => void;
  fallbackMessage: string;
  forbiddenMessage?: string;
  rethrow?: boolean;
};

export function rejectUnauthorizedAction(
  isAllowed: boolean,
  setError: (message: string) => void,
  message: string,
): boolean {
  if (isAllowed) {
    return false;
  }

  setError(message);
  return true;
}

export function handleRequestError({
  error,
  onUnauthorized,
  setError,
  fallbackMessage,
  forbiddenMessage,
  rethrow = false,
}: RequestErrorOptions): void {
  const status = getHttpStatus(error);

  if (status === 401) {
    onUnauthorized();
    return;
  }

  if (status === 403 && forbiddenMessage) {
    setError(forbiddenMessage);
    return;
  }

  setError(fallbackMessage);
  console.error(error);

  if (rethrow) {
    throw error;
  }
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  return (error as HttpError).response?.status;
}