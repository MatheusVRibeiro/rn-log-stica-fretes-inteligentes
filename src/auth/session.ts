export const STORAGE_KEYS = {
  user: "caramello_logistica_user",
  accessToken: "@CaramelloLogistica:token",
  refreshToken: "@CaramelloLogistica:refreshToken",
} as const;

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Por favor, entre novamente.";

export const clearSessionStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
};

