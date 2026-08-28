import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Single axios instance for the whole app.
 * - baseURL comes from VITE_API_URL — set it to http://localhost:5000/api/v1
 *   in your .env, matching app.ts's `app.use('/api/v1/auth', authRoutes)`.
 *   Calls below then use paths like "/auth/login" so the same instance
 *   works for future routers too, e.g. "/categories", "/budgets".
 * - withCredentials:true is required so the httpOnly refresh-token cookie
 *   is sent/received on every request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach the short-lived access token
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — silent refresh on 401, with request queueing so
// simultaneous 401s (e.g. dashboard firing 3 calls at once) don't trigger
// parallel refresh calls and trip your JTI reuse-detection logic.
// ---------------------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Not a 401, or we already retried this exact request — bail out.
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // The refresh call itself came back 401 — no valid session (could be a
    // first-time visitor, a logged-out user, or a genuinely expired/revoked
    // token). Just reject and let the caller decide what to do.
    //
    // IMPORTANT: this branch must NOT force `window.location.href = "/login"`.
    // AuthContext's own silent-refresh-on-mount call hits this exact path for
    // every logged-out visitor — that's expected, not an error state. A hard
    // redirect here causes a full page reload, which re-mounts AuthContext,
    // which calls /auth/refresh again, which 401s again, which redirects
    // again — an infinite reload loop that looks like a spinner that never
    // stops (this is the incognito-tab bug). Let AuthContext's catch block
    // set user to null and render the login UI normally via React state,
    // not a hard navigation.
    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      return Promise.reject(error);
    }

    // Another request already triggered a refresh — queue this one behind it.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");
      const newAccessToken = data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Same reasoning as above: reject and clear the token, but don't force
      // a page reload. The component that made the original request (e.g. a
      // dashboard fetch) will see its promise reject and can handle it —
      // typically by rendering a "please log in again" state via your
      // ProtectedRoute, which already reads `user`/`isLoading` from context.
      processQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;