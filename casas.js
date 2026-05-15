const HOUSES_CONTENT_KEY = "ufo-projects-houses-content";

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

function readHousesContent() {
  return JSON.parse(localStorage.getItem(HOUSES_CONTENT_KEY) || JSON.stringify(defaultHousesContent));
}

function renderHousesLanding() {
  const content = readHousesContent();
  document.querySelectorAll("[data-house]").forEach((element) => {
    element.textContent = content[element.dataset.house] || "";
  });

  const amenityGrid = document.querySelector("#amenityGrid");
  if (amenityGrid) {
    amenityGrid.innerHTML = content.amenities.map((amenity) => `
      <article><span></span><strong>${amenity}</strong></article>
    `).join("");
  }

  const listingGrid = document.querySelector("#listingGrid");
  if (listingGrid) {
    listingGrid.innerHTML = content.listings.map((listing) => `
      <article>
        <span>${listing.price}</span>
        <h3>${listing.title}</h3>
        <p>${listing.description}</p>
        <a href="#contacto">Pedir ficha</a>
      </article>
    `).join("");
  }
}

renderHousesLanding();
