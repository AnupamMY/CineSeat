import { Clock, Languages } from "lucide-react";
import { Link } from "react-router-dom";
export function MovieCard({ movie }) {
  return (
    <Link className="movie-card" to={`/movies/${movie._id}`}>
      <div className="poster">
        {movie.imageUrl ? (
          <img src={movie.imageUrl} alt={movie.name} />
        ) : (
          <div className="poster-fallback">{movie.name.slice(0, 1)}</div>
        )}
        <span className="pill">{movie.genre?.[0] || "Cinema"}</span>
      </div>
      <div className="movie-info">
        <h3>{movie.name}</h3>
        <p>
          <Clock size={15} />
          {movie.durationMinutes} min <Languages size={15} />
          {movie.language}
        </p>
      </div>
    </Link>
  );
}
