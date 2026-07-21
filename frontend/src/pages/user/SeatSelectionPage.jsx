import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { bookingApi, movieApi } from "../../api/services";
import { SeatGrid } from "../../components/seat/SeatGrid";
import { ErrorMessage, Loader } from "../../components/common/UI";
import { money } from "../../utils/format";
export default function SeatSelectionPage() {
  const { showId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [seats, setSeats] = useState();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const refreshSeats = async () => {
      try {
        const latestSeats = await movieApi.seats(showId);
        if (!active) return;
        setSeats(latestSeats);
        setSelected((current) => current.filter((seatNo) => latestSeats.some((seat) => seat.seatNo === seatNo && seat.status === "AVAILABLE")));
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    refreshSeats();
    const interval = window.setInterval(refreshSeats, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [showId]);
  function toggle(seat) {
    setSelected((old) =>
      old.includes(seat.seatNo)
        ? old.filter((x) => x !== seat.seatNo)
        : old.length < 10
          ? [...old, seat.seatNo]
          : old,
    );
  }
  async function proceed() {
    setBusy(true);
    setError("");
    try {
      const hold = await bookingApi.hold({ showId, seatNumbers: selected });
      navigate("/booking/confirm", {
        state: {
          ...state,
          showId,
          seats: hold.seats,
          subtotal: hold.subtotal,
          discounts: hold.discounts,
          discountAmount: hold.discountAmount,
          totalPrice: hold.totalPrice,
          holdExpiresAt: hold.holdExpiresAt,
        },
      });
    } catch (e) {
      setError(e.message);
      movieApi.seats(showId).then(setSeats);
    } finally {
      setBusy(false);
    }
  }
  if (!seats) return <Loader />;
  const total = seats
    .filter((s) => selected.includes(s.seatNo))
    .reduce((sum, s) => sum + s.price, 0);
  return (
    <section className="booking-layout">
      <div>
        <span className="eyebrow">CHOOSE YOUR SPOT</span>
        <h1>{state?.movie?.name || "Select seats"}</h1>
        <SeatGrid seats={seats} selected={selected} onToggle={toggle} />
      </div>
      <aside className="summary">
        <h3>Your selection</h3>
        <p>{selected.length ? selected.join(", ") : "Select up to 10 seats"}</p>
        <div className="total">
          <span>Seat subtotal</span>
          <b>{money(total)}</b>
        </div>
        <small className="field-note">
          Eligible discounts are calculated securely after seats are held.
        </small>
        <ErrorMessage message={error} />
        <button
          className="primary"
          disabled={!selected.length || busy}
          onClick={proceed}
        >
          {busy ? "Holding seats…" : "Continue"}
        </button>
      </aside>
    </section>
  );
}
