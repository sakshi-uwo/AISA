import { atom } from "recoil"

const getAvatarUrl = (user) => {
  if (!user || !user.email) return "";
  let baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
  // Remove /api if it exists to avoid duplication in the template string below
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.replace('/api', '');
  }
  const name = user.name || user.email.split('@')[0];
  return `${baseUrl}/api/auth/proxy-avatar?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(name)}`;
};

const processUser = (user) => {
  if (user) {
    // Fallback if no avatar exists or it's the default placeholder
    if (!user.avatar || user.avatar === '/User.jpeg' || user.avatar === '') {
      return { ...user, avatar: getAvatarUrl(user) };
    }
  }
  return user;
};

export const setUserData = (data) => {
  const existing = JSON.parse(localStorage.getItem('user') || '{}');
  const token = data.token || existing.token;

  // Preserve local name if backend returns default "Demo User" (Offline/Fallback mode)
  if (data.name === "Demo User" && existing.name && existing.name !== "Demo User") {
    data.name = existing.name;
  }

  const processedData = processUser(data);
  const finalData = { ...processedData, token };

  // Update primary user
  localStorage.setItem("user", JSON.stringify(finalData));

  // Update account list
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const existingIndex = accounts.findIndex(a => a.email === finalData.email);
  if (existingIndex > -1) {
    accounts[existingIndex] = finalData;
  } else {
    accounts.push(finalData);
  }
  localStorage.setItem('accounts', JSON.stringify(accounts));
  return finalData;
}
export const getUserData = () => {
  const data = JSON.parse(localStorage.getItem('user'))
  return processUser(data);
}
export const getAccounts = () => {
  const data = JSON.parse(localStorage.getItem('accounts') || '[]');
  return data.map(processUser);
}
export const removeAccount = (email) => {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const filtered = accounts.filter(a => a.email !== email);
  localStorage.setItem('accounts', JSON.stringify(filtered));

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (currentUser.email === email) {
    localStorage.removeItem('user');
    if (filtered.length > 0) {
      localStorage.setItem('user', JSON.stringify(filtered[0]));
    }
  }
}
export const clearUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accounts');
}
export const updateUser = (updates) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const updatedUser = { ...user, ...updates };
  localStorage.setItem('user', JSON.stringify(updatedUser));

  // Also update in accounts list
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const index = accounts.findIndex(a => a.email === user.email);
  if (index > -1) {
    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }
  return updatedUser;
}
const getUser = () => {
  try {
    const item = localStorage.getItem('user');
    if (!item || item === "undefined" || item === "null") return null;
    const user = JSON.parse(item);
    if (user) {
      return processUser(user)
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
    localStorage.removeItem('user'); // Clear corrupted data
  }
  return null
}
export const toggleState = atom({
  key: "toggle",
  default: { subscripPgTgl: false, notify: false, sidebarOpen: false, platformSubTgl: false }
})

export const userData = atom({
  key: 'userData',
  default: { user: getUser() }
})

export const sessionsData = atom({
  key: 'sessionsData',
  default: []
})

export const memoryData = atom({
  key: 'memoryData',
  default: null
})
