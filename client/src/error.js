// Shared API error type.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** Build a friendly error message from a server response body. */
export function friendlyError(err) {
  if (err instanceof ApiError) {
    return err.message || "Bir hata oluştu.";
  }
  if (err instanceof TypeError) {
    return err.message.includes("NetworkError") || err.message.includes("fetch")
      ? "Ağ hatası. Sunucuya bağlanamadı."
      : "Ağ hatası. Kontrol noktasına bağlanamadı.";
  }
  const msg = String(err && err.message);
  return msg || "Bir hata oluştu. Lütfen tekrar deneyin.";
}
