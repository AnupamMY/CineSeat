import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingApi } from "../../api/services";
import { Empty, Loader } from "../../components/common/UI";
import { date, money } from "../../utils/format";
export default function MyBookingsPage() {
  const [bookings, setBookings] = useState();
  useEffect(() => {
    bookingApi.mine().then(setBookings);
  }, []);
  if (!bookings) return <Loader />;
  return (
    <section className="content">
      <span className="eyebrow">YOUR CINEMA HISTORY</span>
      <h1>My tickets</h1>
      {bookings.length ? (
        <div className="booking-list">
          {bookings.map((b) => (
            <article key={b._id}>
              <div>
                <span className={`status ${b.status.toLowerCase()}`}>
                  {b.status}
                </span>
                <h2>{b.movieSnapshot.name}</h2>
                <p>
                  {date(b.showSnapshot.date)} · {b.showSnapshot.startTime} ·{" "}
                  {b.showSnapshot.screenName}
                </p>
                <p>Seats {b.seats.map((s) => s.seatNo).join(", ")}</p>
              </div>
              <div>
                <b>{money(b.totalPrice)}</b>
                <Link to={`/tickets/${b._id}`} state={{ booking: b }}>
                  View ticket →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No tickets yet"
          text="Your confirmed bookings will appear here."
        />
      )}
    </section>
  );
}
