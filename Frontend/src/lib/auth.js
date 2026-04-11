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
  const user = getUser();
  return !!(token && user);
};

export const isSeller = () => {
  const user = getUser();
  // We use .toUpperCase() here to ensure it matches the Backend's "SELLER"
  return user?.role?.toUpperCase() === "SELLER";
};