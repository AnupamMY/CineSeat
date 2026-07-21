export function SeatGrid({ seats, selected, onToggle }) {
  const rows = Object.groupBy
    ? Object.groupBy(seats, (seat) => seat.row)
    : seats.reduce((acc, seat) => ((acc[seat.row] ||= []).push(seat), acc), {});
  const seatCount = Math.max(
    0,
    ...Object.values(rows).map((rowSeats) => rowSeats.length),
  );
  const density =
    seatCount > 40 ? "dense" : seatCount > 24 ? "compact" : "comfortable";
  return (
    <div className={`seat-area ${density}`}>
      <div className="screen-wrap">
        <div className="screen">SCREEN</div>
        <small>All eyes this way</small>
      </div>
      <p className="scroll-hint">Swipe or scroll sideways to see every seat</p>
      <div className="seat-viewport">
        <div className="seat-grid">
          {Object.entries(rows).map(([row, rowSeats]) => (
            <div className="seat-row" key={row}>
              <b>{row}</b>
              {rowSeats.map((seat) => (
                <button
                  type="button"
                  key={seat.seatNo}
                  aria-label={`${seat.seatNo}, ${seat.status.toLowerCase()}, ₹${seat.price}`}
                  title={`${seat.seatNo} · ₹${seat.price}`}
                  disabled={seat.status !== "AVAILABLE"}
                  onClick={() => onToggle(seat)}
                  className={`seat ${selected.includes(seat.seatNo) ? "selected" : seat.status.toLowerCase()}`}
                >
                  {seat.seatNo.replace(row, "")}
                </button>
              ))}
              <b className="row-end">{row}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="legend">
        <span>
          <i className="available" />
          Available
        </span>
        <span>
          <i className="selected" />
          Selected
        </span>
        <span>
          <i className="held" />
          Held
        </span>
        <span>
          <i className="booked" />
          Booked
        </span>
      </div>
    </div>
  );
}
