const stage = document.querySelector("#scrollStage");
const video = document.querySelector("#heroVideo");
const detailsStage = document.querySelector("#detalles");
const detailsVideo = document.querySelector("#detailsVideo");
const STORAGE_KEY = "ufo-carwash-bookings";
const services = [
  { name: "Lavado UFO completo", price: 180, minutes: 45, description: "Exterior, espuma activa, rines, secado y brillo final." },
  { name: "Interior profundo", price: 260, minutes: 75, description: "Aspirado, tablero, vestiduras ligeras y aroma limpio." },
  { name: "Encerado nave madre", price: 340, minutes: 90, description: "Lavado completo con protección y acabado glossy." },
];
const slots = ["09:00", "09:45", "10:30", "11:00", "12:30", "14:00", "15:30", "17:00"];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const mobileVideoQuery = window.matchMedia("(max-width: 820px)");
const videoSources = new WeakMap();

function rememberVideoSource(videoElement) {
  if (!videoElement) return;
  videoSources.set(videoElement, {
    desktop: videoElement.dataset.desktopSrc || videoElement.currentSrc || videoElement.src,
    mobile: videoElement.dataset.mobileSrc,
    mobileEnabled: videoElement.dataset.mobileEnabled === "true",
    usingMobile: false,
  });
}

function setVideoSource(videoElement, preferMobile) {
  const source = videoSources.get(videoElement);
  if (!source) return;

  const hasMobile = preferMobile && source.mobile && source.mobileEnabled;
  const nextSrc = hasMobile ? source.mobile : source.desktop;
  const absoluteNext = new URL(nextSrc, window.location.href).href;
  if (videoElement.currentSrc === absoluteNext || videoElement.src === absoluteNext) return;

  videoElement.classList.toggle("using-mobile-video", hasMobile);
  videoElement.src = nextSrc;
  videoElement.load();
}

function fallbackToDesktop(videoElement) {
  const source = videoSources.get(videoElement);
  if (!source || videoElement.currentSrc.endsWith(source.desktop)) return;
  videoElement.classList.remove("using-mobile-video");
  videoElement.src = source.desktop;
  videoElement.load();
}

function applyResponsiveVideos() {
  const useMobile = mobileVideoQuery.matches;
  setVideoSource(video, useMobile);
  setVideoSource(detailsVideo, useMobile);
}

function scrubVideo(videoElement, progress) {
  if (!videoElement || !Number.isFinite(videoElement.duration) || videoElement.duration <= 0) return;
  const targetTime = progress * Math.max(0, videoElement.duration - 0.05);
  if (Math.abs(videoElement.currentTime - targetTime) > 0.025) {
    if (typeof videoElement.fastSeek === "function") {
      videoElement.fastSeek(targetTime);
    } else {
      videoElement.currentTime = targetTime;
    }
  }
}

function syncScroll() {
  const rect = stage.getBoundingClientRect();
  const scrollable = Math.max(1, stage.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / scrollable, 0, 1);
  const easedUfo = clamp((progress - 0.15) / 0.72, 0, 1);

  document.documentElement.style.setProperty("--dust", String(1 - easedUfo));
  document.documentElement.style.setProperty("--ufo", String(easedUfo));

  scrubVideo(video, progress);
}

function syncDetailsScroll() {
  if (!detailsStage || !detailsVideo) return;

  const rect = detailsStage.getBoundingClientRect();
  const scrollable = Math.max(1, detailsStage.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / scrollable, 0, 1);

  document.documentElement.style.setProperty("--details", String(progress));

  scrubVideo(detailsVideo, progress);
}

function primeVideo() {
  video.pause();
  video.currentTime = 0.001;
  syncScroll();
}

function primeDetailsVideo() {
  detailsVideo.pause();
  detailsVideo.currentTime = 0.001;
  syncDetailsScroll();
}

rememberVideoSource(video);
rememberVideoSource(detailsVideo);
applyResponsiveVideos();

video.addEventListener("loadedmetadata", primeVideo);
video.addEventListener("error", () => fallbackToDesktop(video));
detailsVideo?.addEventListener("loadedmetadata", primeDetailsVideo);
detailsVideo?.addEventListener("error", () => fallbackToDesktop(detailsVideo));
mobileVideoQuery.addEventListener("change", applyResponsiveVideos);
window.addEventListener("scroll", () => {
  syncScroll();
  syncDetailsScroll();
}, { passive: true });
window.addEventListener("resize", () => {
  syncScroll();
  syncDetailsScroll();
});

if (video.readyState >= 1) {
  primeVideo();
}

if (detailsVideo?.readyState >= 1) {
  primeDetailsVideo();
}

function readBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function writeBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function formatMoney(amount) {
  return `$${amount} MXN`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function selectedService() {
  const serviceName = document.querySelector("#serviceSelect").value;
  return services.find((service) => service.name === serviceName) || services[0];
}

function renderServices() {
  const container = document.querySelector("[data-services]");
  if (!container) return;
  container.innerHTML = services.map((service) => `
    <article class="service-card">
      <div>
        <span>${service.minutes} min</span>
        <h3>${service.name}</h3>
        <p>${service.description}</p>
      </div>
      <strong>${formatMoney(service.price)}</strong>
    </article>
  `).join("");
}

function renderServiceSelect() {
  const select = document.querySelector("#serviceSelect");
  if (!select) return;
  select.innerHTML = services.map((service) => (
    `<option value="${service.name}">${service.name} · ${formatMoney(service.price)}</option>`
  )).join("");
}

function renderSlots() {
  const grid = document.querySelector("#slotGrid");
  const dateInput = document.querySelector("#dateInput");
  const selectedDateLabel = document.querySelector("[data-selected-date]");
  if (!grid || !dateInput) return;

  const date = dateInput.value || todayISO();
  const booked = readBookings()
    .filter((booking) => booking.date === date && booking.status !== "Cancelada")
    .map((booking) => booking.time);

  selectedDateLabel.textContent = date === todayISO() ? "Hoy" : date;
  grid.innerHTML = slots.map((slot, index) => {
    const isBooked = booked.includes(slot);
    const selected = !isBooked && index === 2 ? " selected" : "";
    return `<button type="button" class="${selected}" data-slot="${slot}" ${isBooked ? "disabled" : ""}>${slot}</button>`;
  }).join("");

  if (!grid.querySelector(".selected")) {
    const firstAvailable = grid.querySelector("button:not(:disabled)");
    firstAvailable?.classList.add("selected");
  }
}

function updateTotal() {
  const total = document.querySelector("#bookingTotal");
  if (total) total.textContent = formatMoney(selectedService().price);
}

function setupBooking() {
  const form = document.querySelector("#bookingForm");
  const dateInput = document.querySelector("#dateInput");
  const serviceSelect = document.querySelector("#serviceSelect");
  const grid = document.querySelector("#slotGrid");
  const message = document.querySelector("#bookingMessage");
  if (!form || !dateInput || !serviceSelect || !grid) return;

  dateInput.min = todayISO();
  dateInput.value = todayISO();
  renderServiceSelect();
  renderSlots();
  updateTotal();

  document.querySelectorAll("[data-mini-slots] button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector("#reservar").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const match = document.querySelector(`#slotGrid [data-slot="${button.textContent.trim()}"]`);
        if (match && !match.disabled) {
          grid.querySelectorAll("button").forEach((slotButton) => slotButton.classList.remove("selected"));
          match.classList.add("selected");
        }
      }, 450);
    });
  });

  dateInput.addEventListener("change", renderSlots);
  serviceSelect.addEventListener("change", updateTotal);
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slot]");
    if (!button || button.disabled) return;
    grid.querySelectorAll("button").forEach((slotButton) => slotButton.classList.remove("selected"));
    button.classList.add("selected");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const slot = grid.querySelector(".selected")?.dataset.slot;
    if (!slot) {
      message.textContent = "Elige un horario disponible.";
      return;
    }

    const data = new FormData(form);
    const service = selectedService();
    const booking = {
      id: crypto.randomUUID(),
      service: service.name,
      price: service.price,
      date: data.get("date"),
      time: slot,
      customer: data.get("customer").trim(),
      phone: data.get("phone").trim(),
      vehicle: data.get("vehicle").trim(),
      payment: data.get("payment"),
      status: data.get("payment") === "Pago en sitio" ? "Pendiente" : "Pagada",
      createdAt: new Date().toISOString(),
    };

    writeBookings([...readBookings(), booking]);
    message.textContent = `Reserva confirmada para ${booking.customer}: ${booking.date} a las ${booking.time}.`;
    form.reset();
    dateInput.value = todayISO();
    serviceSelect.value = services[0].name;
    renderSlots();
    updateTotal();
  });
}

renderServices();
setupBooking();

function scrollToHashTarget() {
  const target = window.location.hash ? document.querySelector(window.location.hash) : null;
  if (!target) return;
  target.scrollIntoView({ block: "start" });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.addEventListener("load", () => {
  setTimeout(scrollToHashTarget, 100);
  setTimeout(scrollToHashTarget, 700);
  setTimeout(scrollToHashTarget, 1400);
});
