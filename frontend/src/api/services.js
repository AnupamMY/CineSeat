import { api } from "./client";
export const authApi = {
  requestOtp: (data) => api.post("/auth/request-otp", data).then((r) => r.data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout"),
};
export const movieApi = {
  list: () => api.get("/movies").then((r) => r.data.movies),
  get: (id) => api.get(`/movies/${id}`).then((r) => r.data.movie),
  shows: (id) => api.get(`/movies/${id}/shows`).then((r) => r.data.shows),
  seats: (id) => api.get(`/shows/${id}/seats`).then((r) => r.data.seats),
};
export const bookingApi = {
  hold: (data) => api.post("/bookings/hold-seats", data).then((r) => r.data),
  release: (data) =>
    api.post("/bookings/release-seats", data).then((r) => r.data),
  confirm: (data) =>
    api.post("/bookings/confirm", data).then((r) => r.data.booking),
  mine: () => api.get("/bookings/my-bookings").then((r) => r.data.bookings),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data.booking),
  cancel: (id) =>
    api.patch(`/bookings/${id}/cancel`).then((r) => r.data.booking),
};
export const adminApi = {
  movies: () => api.get("/admin/movies").then((r) => r.data.movies),
  createMovie: (data) =>
    api.post("/admin/movies", data).then((r) => r.data.movie),
  updateMovie: (id, data) =>
    api.patch(`/admin/movies/${id}`, data).then((r) => r.data.movie),
  removeMovie: (id) => api.delete(`/admin/movies/${id}`),
  shows: () => api.get("/admin/shows").then((r) => r.data.shows),
  createShow: (data) => api.post("/admin/shows", data).then((r) => r.data.show),
  updateShow: (id, data) =>
    api.patch(`/admin/shows/${id}`, data).then((r) => r.data),
  deleteShow: (id) => api.delete(`/admin/shows/${id}`).then((r) => r.data),
  bookings: () => api.get("/admin/bookings").then((r) => r.data.bookings),
  stats: () => api.get("/admin/stats").then((r) => r.data.stats),
  exportUrl: `${api.defaults.baseURL}/admin/bookings/export`,
};
