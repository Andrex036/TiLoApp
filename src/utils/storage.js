/**
 * @file storage.js
 * Utilidad para persistencia temporal con localStorage.
 * Prepara la estructura para futura integración con Supabase.
 */

// Publish-Subscribe mechanism to sync state across hooks in the same tab
const listeners = {};

function notify(key) {
  if (listeners[key]) {
    listeners[key].forEach(callback => callback(readData(key)));
  }
}

export const subscribe = (key, callback) => {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};

export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notify(key);
  } catch (error) {
    console.error(`Error saving data for ${key}:`, error);
  }
};

export const readData = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading data for ${key}:`, error);
    return null;
  }
};

export const clearData = (key) => {
  localStorage.removeItem(key);
  notify(key);
};
