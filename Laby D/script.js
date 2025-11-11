const AplikacjaPogodowa = class {
    constructor(kluczAPI, selektorWynikow) {
        this.kluczAPI = kluczAPI;
        this.kontenerWynikow = document.querySelector(selektorWynikow);
    }

    // === 1. Pobieranie aktualnej pogody przez XMLHttpRequest ===
    pobierzPogodeBiezaca(miejsce) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(miejsce)}&appid=${this.kluczAPI}&units=metric&lang=pl`;
            xhr.open("GET", url, true);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const dane = JSON.parse(xhr.responseText);
                    console.log("Odpowiedź z Current Weather API:", dane);
                    resolve(dane);
                } else {
                    reject(`Błąd: ${xhr.status}`);
                }
            };
            xhr.onerror = () => reject("Błąd połączenia (XMLHttpRequest)");
            xhr.send();
        });
    }

    // === 2. Pobieranie prognozy 5-dniowej przez Fetch API ===
    pobierzPrognoze(miejsce) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(miejsce)}&appid=${this.kluczAPI}&units=metric&lang=pl`;
        return fetch(url)
            .then(odpowiedz => {
                if (!odpowiedz.ok) throw new Error("Błąd sieci (Fetch)");
                return odpowiedz.json();
            })
            .then(dane => {
                console.log("Odpowiedź z Forecast API:", dane);
                return dane;
            });
    }


    // === 3. Główna funkcja – pobiera dane i wyświetla wyniki ===
    async pobierzPogode(miejsce) {
        this.kontenerWynikow.innerHTML = "<p>Ładowanie danych pogodowych...</p>";

        try {
            const [biezaca, prognoza] = await Promise.all([
                this.pobierzPogodeBiezaca(miejsce),
                this.pobierzPrognoze(miejsce)
            ]);

            this.wyswietlPogode(biezaca, prognoza);
        } catch (blad) {
            this.kontenerWynikow.innerHTML = `<p style="color:red;">${blad}</p>`;
        }
    }

    // === 4. Rysowanie bloków pogodowych ===
    wyswietlPogode(daneBiezace, danePrognozy) {
        this.kontenerWynikow.innerHTML = "";
        this.zmienTlo(daneBiezace.weather[0].description);

        // --- Pogoda bieżąca ---
        const blokBiezacy = this.stworzBlokPogody(
            new Date(daneBiezace.dt * 1000).toLocaleString("pl-PL"),
            daneBiezace.main.temp,
            daneBiezace.main.feels_like,
            daneBiezace.weather[0].icon,
            daneBiezace.weather[0].description
        );
        this.kontenerWynikow.appendChild(blokBiezacy);

        // --- Prognoza co 8 wpisów (czyli co 24h) ---
        const listaPrognozy = danePrognozy.list.filter((_, i) => i % 8 === 0);
        listaPrognozy.forEach(element => {
            const blok = this.stworzBlokPogody(
                new Date(element.dt * 1000).toLocaleString("pl-PL"),
                element.main.temp,
                element.main.feels_like,
                element.weather[0].icon,
                element.weather[0].description
            );
            this.kontenerWynikow.appendChild(blok);
        });
    }

    // === 5. Tworzenie pojedynczego bloku HTML z danymi ===
    stworzBlokPogody(data, temperatura, odczuwalna, ikona, opis) {
        const blok = document.createElement("div");
        blok.classList.add("weather-block");

    // Dobierz emoji w zależności od opisu
        const emoji = this.dajIkonePogody(opis);

        blok.innerHTML = `
            <div class="weather-date">${data}</div>
            <div class="weather-temperature">${emoji} ${temperatura.toFixed(1)} &deg;C</div>
            <div class="weather-temperature-feels-like">Odczuwalna: ${odczuwalna.toFixed(1)} &deg;C</div>
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${ikona}@2x.png">
            <div class="weather-description">${opis}</div>
        `;
        return blok;
    }

    dajIkonePogody(opis) {
        opis = opis.toLowerCase();

        if (opis.includes("słońce") || opis.includes("bezchmurn") || opis.includes("czyste")) return "☀️";
        if (opis.includes("chmur") || opis.includes("pochmurn")) return "☁️";
        if (opis.includes("deszcz") || opis.includes("ulew")) return "🌧️";
        if (opis.includes("burz") || opis.includes("piorun")) return "⛈️";
        if (opis.includes("śnieg")) return "❄️";
        if (opis.includes("mgł") || opis.includes("zamg")) return "🌫️";
        if (opis.includes("wiatr")) return "💨";
        if (opis.includes("grad")) return "🌨️";

        return "🌈";
    }
    zmienTlo(opis) {
        opis = opis.toLowerCase();
        const body = document.body;

        // Usuń poprzednie klasy i animacje
        body.classList.remove("sunny-bg", "cloudy-bg", "rainy-bg", "snowy-bg", "foggy-bg", "default-bg");
        document.querySelectorAll(".weather-animation").forEach(e => e.remove());

        if (opis.includes("słońce") || opis.includes("bezchmurn") || opis.includes("czyste")) {
            body.classList.add("sunny-bg");

        } else if (opis.includes("chmur") || opis.includes("pochmurn")) {
            body.classList.add("cloudy-bg");
            this.dodajChmury();

        } else if (opis.includes("deszcz") || opis.includes("ulew") || opis.includes("burz")) {
            body.classList.add("rainy-bg");
            this.dodajDeszcz();

        } else if (opis.includes("śnieg")) {
            body.classList.add("snowy-bg");
            this.dodajSnieg();

        } else if (opis.includes("mgł") || opis.includes("zamg")) {
            body.classList.add("foggy-bg");

        } else {
            body.classList.add("default-bg");
        }
    }
    // === Efekt: deszcz ===
    dodajDeszcz() {
        for (let i = 0; i < 60; i++) {
            const kropla = document.createElement("div");
            kropla.classList.add("weather-animation", "rain-drop");
            kropla.style.left = Math.random() * 100 + "vw";
            kropla.style.animationDuration = 0.5 + Math.random() * 0.7 + "s";
            kropla.style.animationDelay = Math.random() * 2 + "s";
            document.body.appendChild(kropla);
        }
    }

    // === Efekt: śnieg ===
    dodajSnieg() {
        for (let i = 0; i < 40; i++) {
            const plat = document.createElement("div");
            plat.classList.add("weather-animation", "snow-flake");
            plat.style.left = Math.random() * 100 + "vw";
            plat.style.animationDuration = 3 + Math.random() * 4 + "s";
            plat.style.fontSize = 12 + Math.random() * 10 + "px";
            plat.innerText = "❄";
            document.body.appendChild(plat);
        }
    }

    // === Efekt: chmury ===
    dodajChmury() {
        for (let i = 0; i < 5; i++) {
            const chmura = document.createElement("div");
            chmura.classList.add("weather-animation", "cloud");
            chmura.style.top = Math.random() * 40 + "vh";
            chmura.style.left = -200 + Math.random() * 100 + "px";
            chmura.style.animationDuration = 30 + Math.random() * 20 + "s";
            document.body.appendChild(chmura);
        }
    }

}

// === 6. Inicjalizacja ===
document.aplikacjaPogodowa = new AplikacjaPogodowa("40928dc7b70dd6a35c6bd1ede1831b45", "#weather-results-container");

document.querySelector("#checkButton").addEventListener("click", function() {
    const miejsce = document.querySelector("#locationInput").value;
    if (miejsce.trim() === "") {
        alert("Wpisz nazwę miejscowości!");
        return;
    }
    document.aplikacjaPogodowa.pobierzPogode(miejsce);
});
