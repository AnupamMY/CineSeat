import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { movieApi } from "../../api/services";
import { MovieCard } from "../../components/movie/MovieCard";
import { Empty, Loader } from "../../components/common/UI";
export default function HomePage() {
  const [movies, setMovies] = useState(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    movieApi
      .list()
      .then(setMovies)
      .catch(() => setMovies([]));
  }, []);
  const visible = movies?.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">NOW SHOWING</span>
          <h1>
            Book the seat.
            <br />
            <em>Live the story.</em>
          </h1>
          <p>
            From opening credits to the final scene, your perfect movie night
            starts here.
          </p>
          <a href="#movies" className="primary inline">
            Explore movies <ArrowRight size={18} />
          </a>
        </div>
        <div className="hero-orb">
          <span>
            Tonight’s
            <br />
            <b>best stories</b>
            <br />
            are one click away.
          </span>
        </div>
      </section>
      <section id="movies" className="content">
        <div className="section-head">
          <div>
            <span className="eyebrow">IN CINEMAS</span>
            <h2>Pick your next movie</h2>
          </div>
          <label className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies"
            />
          </label>
        </div>
        {!movies ? (
          <Loader />
        ) : visible.length ? (
          <div className="movie-grid">
            {visible.map((m) => (
              <MovieCard movie={m} key={m._id} />
            ))}
          </div>
        ) : (
          <Empty
            title="No movies found"
            text="New screenings will appear here soon."
          />
        )}
      </section>
    </>
  );
}
