import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock, Languages } from "lucide-react";
import { movieApi } from "../../api/services";
import { date, money } from "../../utils/format";
import { Loader } from "../../components/common/UI";
export default function MovieDetailsPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState();
  const [shows, setShows] = useState([]);
  useEffect(() => {
    Promise.all([movieApi.get(movieId), movieApi.shows(movieId)]).then(
      ([m, s]) => {
        setMovie(m);
        setShows(s);
      },
    );
  }, [movieId]);
  if (!movie) return <Loader />;
  return (
    <section className="details">
      <div className="details-poster">
        {movie.imageUrl ? (
          <img src={movie.imageUrl} alt="" />
        ) : (
          <span>{movie.name[0]}</span>
        )}
      </div>
      <div className="details-copy">
        <span className="eyebrow">NOW SHOWING</span>
        <h1>{movie.name}</h1>
        <div className="meta">
          <span>
            <Clock />
            {movie.durationMinutes} min
          </span>
          <span>
            <Languages />
            {movie.language}
          </span>
          <span>
            <CalendarDays />
            {date(movie.releaseDate)}
          </span>
        </div>
        <p>{movie.description}</p>
        <div className="tags">
          {movie.genre.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>
        <h3>Choose a show</h3>
        <div className="shows">
          {shows.map((s) => (
            <button
              key={s._id}
              onClick={() =>
                navigate(`/shows/${s._id}/seats`, { state: { movie, show: s } })
              }
            >
              <b>{date(s.showDate)}</b>
              <span>
                {s.startTime} · {s.screenName}
              </span>
              <em>from {money(s.price)}</em>
            </button>
          ))}
          {!shows.length && <p>No upcoming shows.</p>}
        </div>
      </div>
    </section>
  );
}
