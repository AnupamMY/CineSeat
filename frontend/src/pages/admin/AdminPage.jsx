import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { adminApi } from "../../api/services";
import { Loader, Toast } from "../../components/common/UI";
import { date, money } from "../../utils/format";

const initialMovie = { name: "", description: "", imageUrl: "", durationMinutes: 120, language: "Hindi", genre: "Drama", releaseDate: "" };
const initialShow = { movieId: "", screenName: "Screen 1", showDate: "", startTime: "18:30", price: 250, rows: 8, seatsPerRow: 10 };
const localDate = (value) => {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
};
const tomorrowDate = () => { const value = new Date(); value.setDate(value.getDate() + 1); return localDate(value); };
const isWebUrl = (value) => { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } };

function Field({ label, note, error, children }) {
  return <label className={error ? "field-invalid" : ""}>{label}{children}{error ? <small className="field-error">{error}</small> : note ? <small className="field-note">{note}</small> : null}</label>;
}

export default function AdminPage() {
  const [stats, setStats] = useState();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movie, setMovie] = useState(initialMovie);
  const [show, setShow] = useState(initialShow);
  const [movieErrors, setMovieErrors] = useState({});
  const [showErrors, setShowErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState("");
  const [editingShow, setEditingShow] = useState(null);
  const minimumDate = useMemo(tomorrowDate, []);

  const notify = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  };
  const load = () => Promise.all([adminApi.stats(), adminApi.movies(), adminApi.shows(), adminApi.bookings()])
    .then(([nextStats, nextMovies, nextShows, nextBookings]) => { setStats(nextStats); setMovies(nextMovies); setShows(nextShows); setBookings(nextBookings); });
  useEffect(() => { load().catch((error) => notify("error", error.message)); }, []);

  function validateMovie() {
    const errors = {};
    if (movie.name.trim().length < 2) errors.name = "Enter at least 2 characters.";
    if (movie.description.trim().length < 10) errors.description = "Enter at least 10 characters.";
    const duration = Number(movie.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 600) errors.durationMinutes = "Use a whole number from 1 to 600 minutes.";
    if (movie.language.trim().length < 2) errors.language = "Enter the movie language.";
    if (!movie.genre.split(",").some((value) => value.trim())) errors.genre = "Add at least one genre.";
    const poster = movie.imageUrl.trim();
    if (poster && !["na", "n/a"].includes(poster.toLowerCase()) && !isWebUrl(poster)) errors.imageUrl = "Enter a complete http:// or https:// URL, or leave it blank.";
    if (!movie.releaseDate || movie.releaseDate < minimumDate) errors.releaseDate = "Release date must be later than today.";
    setMovieErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateShow() {
    const errors = {};
    if (!show.movieId) errors.movieId = "Select a movie.";
    if (show.screenName.trim().length < 2) errors.screenName = "Enter a screen or auditorium name.";
    if (!show.showDate || show.showDate < minimumDate) errors.showDate = "Show date must be later than today.";
    if (!/^\d{2}:\d{2}$/.test(show.startTime)) errors.startTime = "Choose a valid start time.";
    const price = Number(show.price); if (!Number.isFinite(price) || price < 1) errors.price = "Price must be at least ₹1.";
    const rows = Number(show.rows); if (!Number.isInteger(rows) || rows < 1 || rows > 26) errors.rows = "Use between 1 and 26 rows.";
    const seats = Number(show.seatsPerRow); if (!Number.isInteger(seats) || seats < 1 || seats > 50) errors.seatsPerRow = "Use between 1 and 50 seats per row.";
    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function addMovie(event) {
    event.preventDefault();
    if (!validateMovie()) return notify("error", "Please correct the highlighted movie fields.");
    setSubmitting("movie");
    try {
      const imageUrl = movie.imageUrl.trim();
      await adminApi.createMovie({ ...movie, imageUrl: ["na", "n/a"].includes(imageUrl.toLowerCase()) ? "" : imageUrl, durationMinutes: Number(movie.durationMinutes), genre: movie.genre.split(",").map((value) => value.trim()).filter(Boolean) });
      setMovie(initialMovie); setMovieErrors({}); await load(); notify("success", "Movie added successfully.");
    } catch (error) { notify("error", error.message); }
    finally { setSubmitting(""); }
  }

  async function addShow(event) {
    event.preventDefault();
    if (!validateShow()) return notify("error", "Please correct the highlighted show fields.");
    setSubmitting("show");
    try {
      await adminApi.createShow({ ...show, price: Number(show.price), rows: Number(show.rows), seatsPerRow: Number(show.seatsPerRow) });
      setShow(initialShow); setShowErrors({}); await load(); notify("success", "Show and seat layout created successfully.");
    } catch (error) { notify("error", error.message); }
    finally { setSubmitting(""); }
  }

  function openShowEditor(createdShow) {
    setEditingShow({
      _id: createdShow._id,
      movieId: createdShow.movieId?._id || createdShow.movieId,
      screenName: createdShow.screenName,
      showDate: localDate(new Date(createdShow.showDate)),
      startTime: createdShow.startTime,
      price: createdShow.price,
      status: createdShow.status,
    });
  }

  async function saveShow(event) {
    event.preventDefault();
    setSubmitting("edit-show");
    try {
      await adminApi.updateShow(editingShow._id, { ...editingShow, _id: undefined, price: Number(editingShow.price) });
      setEditingShow(null); await load(); notify("success", "Show updated successfully.");
    } catch (error) { notify("error", error.message); }
    finally { setSubmitting(""); }
  }

  async function removeShow(createdShow) {
    const confirmed = window.confirm(`Delete ${createdShow.movieId?.name || "this show"} on ${date(createdShow.showDate)} at ${createdShow.startTime}? Shows with bookings will be cancelled instead.`);
    if (!confirmed) return;
    try {
      const result = await adminApi.deleteShow(createdShow._id);
      await load(); notify("success", result.message);
    } catch (error) { notify("error", error.message); }
  }

  if (!stats) return <Loader/>;
  return <section className="admin content">
    <Toast toast={toast} onClose={() => setToast(null)}/>
    {editingShow && <div className="modal-backdrop" role="presentation"><form className="panel edit-show-modal" onSubmit={saveShow}><div className="modal-title"><div><span className="eyebrow">EDIT SHOW</span><h2>Update show details</h2></div><button type="button" className="icon-action" onClick={() => setEditingShow(null)} aria-label="Close"><X size={19}/></button></div><Field label="Movie" note="The seat layout remains unchanged."><select value={editingShow.movieId} onChange={(e) => setEditingShow({ ...editingShow, movieId: e.target.value })}>{movies.filter((item) => item.status === "ACTIVE").map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</select></Field><Field label="Screen or auditorium"><input required minLength="2" value={editingShow.screenName} onChange={(e) => setEditingShow({ ...editingShow, screenName: e.target.value })}/></Field><div className="form-row"><Field label="Show date"><input required type="date" min={minimumDate} value={editingShow.showDate} onChange={(e) => setEditingShow({ ...editingShow, showDate: e.target.value })}/></Field><Field label="Start time"><input required type="time" value={editingShow.startTime} onChange={(e) => setEditingShow({ ...editingShow, startTime: e.target.value })}/></Field></div><div className="form-row"><Field label="Base price (₹)"><input required type="number" min="1" max="100000" value={editingShow.price} onChange={(e) => setEditingShow({ ...editingShow, price: e.target.value })}/></Field><Field label="Status"><select value={editingShow.status} onChange={(e) => setEditingShow({ ...editingShow, status: e.target.value })}><option value="SCHEDULED">Scheduled</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select></Field></div><p className="field-note">Rows and seats per row cannot be edited after seats are generated.</p><div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditingShow(null)}>Cancel</button><button className="primary" disabled={submitting === "edit-show"}>{submitting === "edit-show" ? "Saving…" : "Save changes"}</button></div></form></div>}
    <div className="section-head"><div><span className="eyebrow">CONTROL ROOM</span><h1>Admin dashboard</h1></div><a className="primary inline" href={adminApi.exportUrl}>Export CSV</a></div>
    <div className="stats"><article><span>Total bookings</span><b>{stats.totalBookings}</b></article><article><span>Confirmed</span><b>{stats.confirmedBookings}</b></article><article><span>Revenue</span><b>{money(stats.revenue)}</b></article><article><span>Movies</span><b>{movies.length}</b></article></div>
    <div className="admin-grid">
      <form className="panel" onSubmit={addMovie} noValidate><h2>Add a movie</h2>
        <Field label="Movie name" note="2–120 characters." error={movieErrors.name}><input value={movie.name} maxLength="120" onChange={(e) => setMovie({ ...movie, name: e.target.value })}/></Field>
        <Field label="Description" note="Briefly describe the movie (10–2,000 characters)." error={movieErrors.description}><textarea value={movie.description} maxLength="2000" onChange={(e) => setMovie({ ...movie, description: e.target.value })}/></Field>
        <div className="form-row">
          <Field label="Duration (minutes)" note="Whole minutes, maximum 600." error={movieErrors.durationMinutes}><input type="number" min="1" max="600" step="1" value={movie.durationMinutes} onChange={(e) => setMovie({ ...movie, durationMinutes: e.target.value })}/></Field>
          <Field label="Language" note="For example: Hindi or English." error={movieErrors.language}><input value={movie.language} maxLength="50" onChange={(e) => setMovie({ ...movie, language: e.target.value })}/></Field>
        </div>
        <Field label="Genres" note="Separate multiple genres with commas, e.g. Drama, Thriller." error={movieErrors.genre}><input value={movie.genre} onChange={(e) => setMovie({ ...movie, genre: e.target.value })}/></Field>
        <Field label="Poster URL (optional)" note="Use a complete http:// or https:// URL. Leave blank when unavailable; NA is also accepted." error={movieErrors.imageUrl}><input type="url" placeholder="https://example.com/poster.jpg" value={movie.imageUrl} onChange={(e) => setMovie({ ...movie, imageUrl: e.target.value })}/></Field>
        <Field label="Release date" note={`Must be later than today. Earliest: ${minimumDate}.`} error={movieErrors.releaseDate}><input type="date" min={minimumDate} value={movie.releaseDate} onChange={(e) => setMovie({ ...movie, releaseDate: e.target.value })}/></Field>
        <button className="primary" disabled={submitting === "movie"}>{submitting === "movie" ? "Adding movie…" : "Add movie"}</button>
      </form>
      <form className="panel" onSubmit={addShow} noValidate><h2>Create a show and seats</h2>
        <Field label="Movie" note="Only active movies can receive new shows." error={showErrors.movieId}><select value={show.movieId} onChange={(e) => setShow({ ...show, movieId: e.target.value })}><option value="">Select movie</option>{movies.filter((item) => item.status === "ACTIVE").map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</select></Field>
        <Field label="Screen or auditorium" note="For example: Screen 1 or IMAX Auditorium." error={showErrors.screenName}><input value={show.screenName} maxLength="80" onChange={(e) => setShow({ ...show, screenName: e.target.value })}/></Field>
        <div className="form-row">
          <Field label="Show date" note="Must be later than today." error={showErrors.showDate}><input type="date" min={minimumDate} value={show.showDate} onChange={(e) => setShow({ ...show, showDate: e.target.value })}/></Field>
          <Field label="Start time" note="Local cinema time." error={showErrors.startTime}><input type="time" value={show.startTime} onChange={(e) => setShow({ ...show, startTime: e.target.value })}/></Field>
        </div>
        <div className="form-row">
          <Field label="Base price (₹)" note="Regular-seat price." error={showErrors.price}><input type="number" min="1" max="100000" value={show.price} onChange={(e) => setShow({ ...show, price: e.target.value })}/></Field>
          <Field label="Rows" note="1–26 rows (A–Z)." error={showErrors.rows}><input type="number" min="1" max="26" step="1" value={show.rows} onChange={(e) => setShow({ ...show, rows: e.target.value })}/></Field>
          <Field label="Seats per row" note="1–50 seats. 100 is not allowed." error={showErrors.seatsPerRow}><input type="number" min="1" max="50" step="1" value={show.seatsPerRow} onChange={(e) => setShow({ ...show, seatsPerRow: e.target.value })}/></Field>
        </div>
        <p className="seat-count">This layout will create <b>{Math.max(0, Number(show.rows) || 0) * Math.max(0, Number(show.seatsPerRow) || 0)}</b> seats.</p>
        <button className="primary" disabled={submitting === "show"}>{submitting === "show" ? "Creating show…" : "Create show & seats"}</button>
      </form>
    </div>
    <section className="panel table-panel"><div className="table-title"><div><h2>Created shows</h2><p>Every show and seat layout created by the admin.</p></div><span>{shows.length} total</span></div><div className="table-wrap"><table><thead><tr><th>Movie</th><th>Date</th><th>Time</th><th>Screen</th><th>Base price</th><th>Total seats</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{shows.length ? shows.map((createdShow) => <tr key={createdShow._id}><td><b>{createdShow.movieId?.name || "Deleted movie"}</b></td><td>{date(createdShow.showDate)}</td><td>{createdShow.startTime}</td><td>{createdShow.screenName}</td><td>{money(createdShow.price)}</td><td>{createdShow.totalSeats}</td><td><span className={`status ${createdShow.status.toLowerCase()}`}>{createdShow.status}</span></td><td>{date(createdShow.createdAt)}</td><td><div className="row-actions"><button type="button" className="icon-action edit" title="Edit show" aria-label="Edit show" onClick={() => openShowEditor(createdShow)}><Pencil size={16}/></button><button type="button" className="icon-action delete" title="Delete show" aria-label="Delete show" onClick={() => removeShow(createdShow)}><Trash2 size={16}/></button></div></td></tr>) : <tr><td colSpan="9" className="empty-row">No shows created yet. Use the form above to create the first one.</td></tr>}</tbody></table></div></section>
    <section className="panel table-panel"><h2>Recent bookings</h2><div className="table-wrap"><table><thead><tr><th>Booking</th><th>Movie</th><th>User</th><th>Show</th><th>Seats</th><th>Total</th><th>Status</th></tr></thead><tbody>{bookings.slice(0, 20).map((booking) => <tr key={booking._id}><td>{booking.bookingNumber}</td><td>{booking.movieSnapshot.name}</td><td>{booking.userId?.email}</td><td>{date(booking.showSnapshot.date)} {booking.showSnapshot.startTime}</td><td>{booking.seats.map((seat) => seat.seatNo).join(", ")}</td><td>{money(booking.totalPrice)}</td><td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td></tr>)}</tbody></table></div></section>
  </section>;
}
