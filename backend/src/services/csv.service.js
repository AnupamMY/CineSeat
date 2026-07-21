const escapeCsv = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function bookingsToCsv(bookings) {
  const columns = [
    "bookingNumber",
    "userName",
    "userEmail",
    "movieName",
    "date",
    "time",
    "screenName",
    "seatNo",
    "seatPrice",
    "subtotal",
    "discountAmount",
    "totalPrice",
    "status",
    "bookedAt",
  ];
  const rows = bookings.flatMap((booking) =>
    booking.seats.map((seat) => ({
      bookingNumber: booking.bookingNumber,
      userName: booking.userId?.name,
      userEmail: booking.userId?.email,
      movieName: booking.movieSnapshot.name,
      date: new Date(booking.showSnapshot.date).toISOString().slice(0, 10),
      time: booking.showSnapshot.startTime,
      screenName: booking.showSnapshot.screenName,
      seatNo: seat.seatNo,
      seatPrice: seat.price,
      subtotal: booking.subtotal || booking.totalPrice,
      discountAmount: booking.discountAmount || 0,
      totalPrice: booking.totalPrice,
      status: booking.status,
      bookedAt: booking.bookedAt.toISOString(),
    })),
  );
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((key) => escapeCsv(row[key])).join(",")),
  ].join("\n");
}
