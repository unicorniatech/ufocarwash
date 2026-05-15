const STORAGE_KEY = "ufo-carwash-bookings";
const HOUSES_CONTENT_KEY = "ufo-projects-houses-content";
const SERVICES = {
  "Lavado UFO completo": 180,
  "Interior profundo": 260,
  "Encerado nave madre": 340,
};

const table = document.querySelector("#bookingTable");
const stats = document.querySelector("#adminStats");
const dateFilter = document.querySelector("#adminDate");
const statusFilter = document.querySelector("#statusFilter");
const housesEditor = document.querySelector("#housesEditor");
const housesEditorMessage = document.querySelector("#housesEditorMessage");

const defaultHousesContent = {
  name: "Residencial Cielo Sur",
  location: "Zacatepec, Morelos",
  price: "Desde $1.89M MXN",
  cta: "Agendar visita",
  headline: "Casas listas para vivir, invertir y crecer en Morelos.",
  description: "Una landing sobria para desarrollos inmobiliarios: modelos claros, beneficios concretos, ubicación y llamada directa a visita. Sin hero cinematográfico, enfocada en conversión.",
  amenities: ["Seguridad 24/7", "Roof garden", "Cisterna", "Estacionamiento", "Áreas verdes", "Entrega programada"],
  listings: [
    { title: "Modelo Aurora", description: "3 recámaras, 2.5 baños, cocina equipada y patio privado.", price: "$1.89M" },
    { title: "Modelo Terraza", description: "Espacios amplios, balcón principal y opción de ampliación.", price: "$2.35M" },
    { title: "Modelo Inversión", description: "Unidad compacta con alta demanda de renta en zona conectada.", price: "$1.45M" },
  ],
};

const today = new Date().toISOString().slice(0, 10);
dateFilter.value = today;

function readBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function writeBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function readHousesContent() {
  return JSON.parse(localStorage.getItem(HOUSES_CONTENT_KEY) || JSON.stringify(defaultHousesContent));
}

function writeHousesContent(content) {
  localStorage.setItem(HOUSES_CONTENT_KEY, JSON.stringify(content));
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

function listingsToText(listings) {
  return listings.map((listing) => `${listing.title} | ${listing.description} | ${listing.price}`).join("\n");
}

function textToListings(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "Modelo", description = "Descripción pendiente", price = "$0"] = line.split("|").map((part) => part.trim());
      return { title, description, price };
    });
}

function fillHousesEditor(content = readHousesContent()) {
  if (!housesEditor) return;
  housesEditor.querySelector('[name="name"]').value = content.name;
  housesEditor.querySelector('[name="location"]').value = content.location;
  housesEditor.querySelector('[name="price"]').value = content.price;
  housesEditor.querySelector('[name="cta"]').value = content.cta;
  housesEditor.querySelector('[name="headline"]').value = content.headline;
  housesEditor.querySelector('[name="description"]').value = content.description;
  housesEditor.querySelector('[name="amenities"]').value = content.amenities.join(", ");
  housesEditor.querySelector('[name="listings"]').value = listingsToText(content.listings);
}

housesEditor?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(housesEditor);
  const content = {
    name: data.get("name").trim(),
    location: data.get("location").trim(),
    price: data.get("price").trim(),
    cta: data.get("cta").trim(),
    headline: data.get("headline").trim(),
    description: data.get("description").trim(),
    amenities: data.get("amenities").split(",").map((item) => item.trim()).filter(Boolean),
    listings: textToListings(data.get("listings")),
  };
  writeHousesContent(content);
  housesEditorMessage.textContent = "Landing de casas guardada. Abre la página de Casas para verla actualizada.";
});

document.querySelector("#resetHousesContent")?.addEventListener("click", () => {
  writeHousesContent(defaultHousesContent);
  fillHousesEditor(defaultHousesContent);
  housesEditorMessage.textContent = "Contenido demo restaurado.";
});

fillHousesEditor();
