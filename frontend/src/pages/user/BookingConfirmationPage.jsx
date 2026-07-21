import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { bookingApi } from "../../api/services";
import { ErrorMessage } from "../../components/common/UI";
import { money } from "../../utils/format";

export default function BookingConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state) return <section className="content"><p>No seats are being held.</p></section>;
  const seatNumbers = state.seats.map((seat) => seat.seatNo);

  async function confirm() {
    setBusy(true); setError("");
    try {
      const booking = await bookingApi.confirm({ showId: state.showId, seatNumbers, idempotencyKey: crypto.randomUUID() });
      navigate(`/tickets/${booking._id}`, { state: { booking } });
    } catch (requestError) { setError(requestError.message); setBusy(false); }
  }
  async function cancelHold() {
    setBusy(true); setError("");
    try {
      await bookingApi.release({ showId: state.showId, seatNumbers });
      navigate(`/shows/${state.showId}/seats`, { replace: true, state: { movie: state.movie, show: state.show } });
    } catch (requestError) { setError(requestError.message); setBusy(false); }
  }

  return <section className="confirm-card"><CheckCircle2/><span className="eyebrow">ALMOST THERE</span><h1>Confirm your booking</h1><div className="ticket-preview"><h2>{state.movie?.name}</h2><p>{state.show?.screenName} · {state.show?.startTime}</p><p>Seats <b>{seatNumbers.join(", ")}</b></p><div className="price-line"><span>Seat subtotal</span><b>{money(state.subtotal ?? state.totalPrice)}</b></div>{state.discounts?.map((discount) => <div className="price-line discount-line" key={discount.code}><span>{discount.label}</span><b>−{money(discount.amount)}</b></div>)}<div className="total"><span>Amount payable</span><b>{money(state.totalPrice)}</b></div></div><ErrorMessage message={error}/><div className="confirmation-actions"><button className="secondary cancel-hold" type="button" onClick={cancelHold} disabled={busy}><XCircle size={17}/> Cancel booking</button><button className="primary" onClick={confirm} disabled={busy}>{busy ? "Please wait…" : "Confirm booking"}</button></div></section>;
}
