export const getUser = () => {
  const session = localStorage.getItem("user_session");
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("jwt_token");
  return !!token;
};

export const isSeller = () => {
  try {
    const session = JSON.parse(localStorage.getItem("user_session"));
    return !!(session && (session.role === "ROLE_SELLER" || session.role === "SELLER"));
  } catch (e) {
    return false;
  }
};

/**
 * Checks if the required local storage keys exist during initial lifecycle boot
 */
export const hasStoredSession = () => {
  return !!(localStorage.getItem("jwt_token") && localStorage.getItem("user_session"));
};