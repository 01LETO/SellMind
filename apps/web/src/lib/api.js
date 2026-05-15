const API_BASE = import.meta.env.VITE_API_URL;

export function apiUrl(path) {
  if (API_BASE) {
    return API_BASE + path.replace(/^\/api/, '');
  }
  return path;
}
