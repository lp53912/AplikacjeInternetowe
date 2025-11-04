document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', { center: [52.0, 19.0], zoom: 6, zoomControl: true, dragging: true, scrollWheelZoom: true });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors',
  crossOrigin: true,
  tileSize: 256
}).addTo(map);

    const locBtn = document.getElementById('locBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const notifyBtn = document.getElementById('notifyBtn');
    const coordsDiv = document.getElementById('coords');
    const stol = document.getElementById('stol');
  
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('div');
      el.className = 'puzzle-piece';
      el.textContent = i + 1;
      stol.appendChild(el);
    }
  
    let userMarker = null;
  
    // -------------lokalizacja----------
    locBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        coordsDiv.textContent = 'Geolokalizacja nie jest wspierana przez tę przeglądarkę.';
        return;
      }
      coordsDiv.textContent = 'Pobieranie lokalizacji...';
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          coordsDiv.textContent = `Twoja lokalizacja: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  
          map.flyTo([latitude, longitude], 13);
  
          if (userMarker) map.removeLayer(userMarker);
          userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Tu jesteś!').openPopup();
  
          if (Notification.permission === 'granted') {
            new Notification('Zlokalizowano Cię!', { body: `Twoje współrzędne: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
          }
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED: coordsDiv.textContent = 'Użytkownik odmówił dostępu do lokalizacji.'; break;
            case error.POSITION_UNAVAILABLE: coordsDiv.textContent = 'Informacja o lokalizacji jest niedostępna.'; break;
            case error.TIMEOUT: coordsDiv.textContent = 'Przekroczono czas oczekiwania na lokalizację.'; break;
            default: coordsDiv.textContent = 'Nieznany błąd lokalizacji.';
          }
        }
      );
    });
  
    // ---------------powiadomienia--------------
    notifyBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) { alert('Ta przeglądarka nie obsługuje powiadomień.'); return; }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') new Notification('Powiadomienia włączone', { body: 'Możesz teraz otrzymywać komunikaty z aplikacji.' });
      else if (permission === 'denied') alert('Odmówiono dostępu do powiadomień.');
      else alert('Zgoda na powiadomienia nie została jeszcze udzielona.');
    });
  
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function sliceImageToPieces(dataUrl, rows = 4, cols = 4) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const tileW = Math.floor(img.width / cols);
  const tileH = Math.floor(img.height / rows);
  const pieces = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      canvas.width = tileW;
      canvas.height = tileH;
      ctx.clearRect(0, 0, tileW, tileH);
      ctx.drawImage(img, x * tileW, y * tileH, tileW, tileH, 0, 0, tileW, tileH);
      pieces.push(canvas.toDataURL("image/png"));
    }
  }
  return pieces;
}

//----------ukonczenie-------------
function checkPuzzleCompletion(container) {
  const pieces = [...container.querySelectorAll("img")];
  const ok = pieces.every((img, i) => Number(img.dataset.correct) === i);
  if (ok) {
    console.log("✅ Ułożone!"); //to na f12
    // a tutaj powiadomienie
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Gratulacje!", { body: "Ułożyłeś/łaś wszystkie elementy mapy 🎉" });
      } else {
        Notification.requestPermission().then(p => {
          if (p === "granted") new Notification("Gratulacje!", { body: "Ułożone puzzle 🎉" });
        });
      }
    }
  }
}

// ---------puzzle----------------
async function buildPuzzleFromMap() {
  const mapEl = document.getElementById("map");
  const stol = document.getElementById("stol");
  stol.innerHTML = "";
  
  // brak przyblizenia
  const zoomControl = mapEl.querySelector('.leaflet-control-zoom');
  if (zoomControl) zoomControl.style.display = 'none';

  //----------screen-----------
  const canvas = await html2canvas(mapEl, { 
    useCORS: true, 
    allowTaint: false,
    ignoreElements: (el) => {
      return el.classList.contains('leaflet-control-zoom');
    }
  });

  //i znowu jest przyblizenie
  if (zoomControl) zoomControl.style.display = '';
  const dataUrl = canvas.toDataURL("image/png");

  // png na dysk
  const a = document.createElement("a");
  a.href = dataUrl; a.download = "mapa.png";
  document.body.appendChild(a); a.click(); a.remove();

  // pocięcie na 16 kawałków
  const tiles = await sliceImageToPieces(dataUrl, 4, 4);
  // wymieszaj i wyrzuć na stół
  const shuffled = shuffle(tiles.map((src, correctIndex) => ({ src, correctIndex })));

  // render elementów + DnD
  shuffled.forEach(({ src, correctIndex }, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "puzzle-piece";
    img.draggable = true;
    img.dataset.correct = String(correctIndex); // docelowy indeks
    img.dataset.pid = Math.random().toString(36).slice(2); // id do DnD

    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("application/piece-id", img.dataset.pid);
    });

    img.addEventListener("dragover", e => e.preventDefault());

    img.addEventListener("drop", e => {
  e.preventDefault();
  const fromPid = e.dataTransfer.getData("application/piece-id");
  const fromEl = [...stol.querySelectorAll(".puzzle-piece")].find(x => x.dataset.pid === fromPid);
  if (!fromEl || fromEl === img) return;

  // pobierz kolejność wszystkich elementów
  const children = [...stol.children];
  const fromIndex = children.indexOf(fromEl);
  const toIndex = children.indexOf(img);

  // zamień ich miejsca w tablicy
  children[fromIndex] = img;
  children[toIndex] = fromEl;

  // odśwież DOM w nowej kolejności
  stol.innerHTML = '';
  children.forEach(el => stol.appendChild(el));

  checkPuzzleCompletion(stol);
});


    stol.appendChild(img);
  });
}

// --- podpięcie do przycisku „Pobierz mapę” ---
downloadBtn.addEventListener("click", () => {
  buildPuzzleFromMap().catch(err => {
    console.error(err);
    alert("Nie udało się utworzyć puzzli.");
  });
});

//  UDOSTĘPNIJ FUNKCJE DO KONSOLI
    window.checkPuzzleCompletion = checkPuzzleCompletion;

    window.autoSolve = () => {
        const stol = document.getElementById('stol');
        const pieces = [...stol.querySelectorAll('img')]
            .sort((a, b) => Number(a.dataset.correct) - Number(b.dataset.correct));
        stol.innerHTML = '';
        pieces.forEach(p => stol.appendChild(p));
        window.checkPuzzleCompletion(stol);
    };


    window._labC = { map };
  });