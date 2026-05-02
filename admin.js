const STORAGE_KEY = "ufo-carwash-bookings";
const SERVICES = {
  "Lavado UFO completo": 180,
  "Interior profundo": 260,
  "Encerado nave madre": 340,
};

const table = document.querySelector("#bookingTable");
const stats = document.querySelector("#adminStats");
const dateFilter = document.querySelector("#adminDate");
const statusFilter = document.querySelector("#statusFilter");

const today = new Date().toISOString().slice(0, 10);
dateFilter.value = today;

function readBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function writeBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function money(amount) {
  return `$${amount} MXN`;
}

function seedBookings() {
  const demo = [
    {
      id: crypto.randomUUID(),
      service: "Lavado UFO completo",
      price: 180,
      date: today,
      time: "10:30",
      customer: "Mariana Flores",
      phone: "777 101 2020",
      vehicle: "Mazda negro",
      payment: "Tarjeta simulada",
      status: "Pagada",
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      service: "Interior profundo",
      price: 260,
      date: today,
      time: "12:30",
      customer: "Carlos Nava",
      phone: "777 303 4040",
      vehicle: "Versa gris",
      payment: "Pago en sitio",
      status: "Pendiente",
      createdAt: new Date().toISOString(),
    },
  ];
  writeBookings([...readBookings(), ...demo]);
  renderAdmin();
}

function setStatus(id, status) {
  const bookings = readBookings().map((booking) =>
    booking.id === id ? { ...booking, status } : booking
  );
  writeBookings(bookings);
  renderAdmin();
}

function renderStats(bookings) {
  const paid = bookings.filter((booking) => booking.status === "Pagada").length;
  const pending = bookings.filter((booking) => booking.status === "Pendiente").length;
  const revenue = bookings
    .filter((booking) => booking.status !== "Cancelada")
    .reduce((sum, booking) => sum + Number(booking.price || 0), 0);

  stats.innerHTML = `
    <article><span>Hoy</span><strong>${bookings.length}</strong></article>
    <article><span>Pagadas</span><strong>${paid}</strong></article>
    <article><span>Pendientes</span><strong>${pending}</strong></article>
    <article><span>Ingreso</span><strong>${money(revenue)}</strong></article>
  `;
}

function renderAdmin() {
  const selectedDate = dateFilter.value;
  const selectedStatus = statusFilter.value;
  const all = readBookings();
  const filtered = all
    .filter((booking) => booking.date === selectedDate)
    .filter((booking) => selectedStatus === "all" || booking.status === selectedStatus)
    .sort((a, b) => a.time.localeCompare(b.time));

  renderStats(all.filter((booking) => booking.date === selectedDate));

  if (!filtered.length) {
    table.innerHTML = `
      <div class="empty-state">
        <h2>No hay reservas para este filtro.</h2>
        <p>Crea una reserva desde la página principal o carga datos demo.</p>
      </div>
    `;
    return;
  }

  table.innerHTML = filtered.map((booking) => `
    <article class="admin-card" data-id="${booking.id}">
      <div>
        <span class="status-pill ${booking.status.toLowerCase()}">${booking.status}</span>
        <h2>${booking.time} · ${booking.customer}</h2>
        <p>${booking.service} · ${booking.vehicle}</p>
      </div>
      <div class="admin-meta">
        <strong>${money(booking.price)}</strong>
        <span>${booking.payment}</span>
        <a href="tel:${booking.phone}">${booking.phone}</a>
      </div>
      <div class="admin-actions">
        <button type="button" data-status="Pagada">Pagada</button>
        <button type="button" data-status="Completada">Completar</button>
        <button type="button" data-status="Cancelada">Cancelar</button>
      </div>
    </article>
  `).join("");
}

table.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]");
  if (!button) return;
  const card = button.closest(".admin-card");
  setStatus(card.dataset.id, button.dataset.status);
});

document.querySelector("#seedBookings").addEventListener("click", seedBookings);
document.querySelector("#clearDone").addEventListener("click", () => {
  writeBookings(readBookings().filter((booking) => booking.status !== "Completada"));
  renderAdmin();
});
dateFilter.addEventListener("change", renderAdmin);
statusFilter.addEventListener("change", renderAdmin);

renderAdmin();
