const collectMessages = (value, fieldName = "") => {
  if (typeof value === "string") {
    return [fieldName ? `${fieldName}: ${value}` : value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMessages(item, fieldName));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      collectMessages(item, key === "non_field_errors" ? fieldName : key)
    );
  }
  return [];
};

export function getApiErrorMessage(data, fallback) {
  const errorValue = data?.error;
  const detail = (
    errorValue && typeof errorValue === "object"
      ? errorValue.detail
      : undefined
  ) ?? data?.detail ?? (typeof errorValue === "string" ? errorValue : undefined);
  const messages = collectMessages(detail);
  if (messages.length) return messages.join(" ");

  const message = data?.error?.message ?? data?.message;
  return typeof message === "string" && message !== "Request failed."
    ? message
    : fallback;
}
