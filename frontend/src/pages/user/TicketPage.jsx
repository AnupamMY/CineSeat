import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { bookingApi } from "../../api/services";
import { Loader } from "../../components/common/UI";
import { date, money } from "../../utils/format";
export default function TicketPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking);
  useEffect(() => {
    if (!booking) bookingApi.get(bookingId).then(setBooking);
  }, [booking, bookingId]);
  if (!booking) return <Loader />;
  return (
    <section className="ticket-page">
      <div className="ticket">
        <div className="ticket-top">
          <Clapperboard />
          <span>CINESEAT ADMIT ONE</span>
        </div>
        <div className="ticket-body">
          <span className={`status ${booking.status.toLowerCase()}`}>
            {booking.status}
          </span>
          <h1>{booking.movieSnapshot.name}</h1>
          <div className="ticket-data">
            <div>
              <small>DATE</small>
              <b>{date(booking.showSnapshot.date)}</b>
            </div>
            <div>
              <small>TIME</small>
              <b>{booking.showSnapshot.startTime}</b>
            </div>
            <div>
              <small>SCREEN</small>
              <b>{booking.showSnapshot.screenName}</b>
            </div>
            <div>
              <small>SEATS</small>
              <b>{booking.seats.map((s) => s.seatNo).join(", ")}</b>
            </div>
          </div>
          {booking.discountAmount > 0 && (
            <div className="ticket-discounts">
              <div>
                <span>Subtotal</span>
                <b>{money(booking.subtotal)}</b>
              </div>
              {booking.discounts.map((discount) => (
                <div key={discount.code}>
                  <span>{discount.label}</span>
                  <b>−{money(discount.amount)}</b>
                </div>
              ))}
            </div>
          )}
          <div className="ticket-total">
            <span>{booking.bookingNumber}</span>
            <b>{money(booking.totalPrice)}</b>
          </div>
        </div>
      </div>
      <button className="primary no-print" style={{ width: "100px" }} onClick={() => window.print()}>
        Download / print ticket
      </button>
    </section>
  );
}
