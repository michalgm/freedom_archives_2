const errorMessages: Record<string, string> = {
  "jwt expired": "Your session has expired. Please log in again.",
};

export const parseError = (error: unknown): string => {
  let message: string;
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message || error.toString();
  } else if (error !== null && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    message = typeof obj.message === "string" && obj.message
      ? obj.message
      : JSON.stringify(error);
  } else {
    message = String(error);
  }
  return errorMessages[message] ?? message;
};
