// Este código foi desenvolvido por Gustavo Cerqueira Murai.
// GitHub: https://github.com/gustavomurai
// Behance: https://www.behance.net/Muraiart



document.getElementById('toggleModo').addEventListener('click', function () {
  document.body.classList.toggle('modo-escuro');

  const botao = document.getElementById('toggleModo');
  const modoEscuroAtivo = document.body.classList.contains('modo-escuro');

  botao.innerText = modoEscuroAtivo ? '☀️ Modo Claro' : '🌙 Modo Noturno';

  alternarModoMapa(modoEscuroAtivo);
});

let mapa;
let camadaClaro;
let camadaEscuro;
let marcador;

async function buscarClima() {
  const cidade = document.getElementById('cidade').value;
  const resultado = document.getElementById('resultado');
  const mapaDiv = document.getElementById('mapa');
  document.getElementById('mapa').style.display = 'block';

  if (!cidade) {
    resultado.innerHTML = "<p>❌ Digite uma cidade!</p>";
    mapaDiv.innerHTML = "";
    return;
  }

  try {
    // API Key agora sendo utilizada diretamente
    const apiKey = '170f8c5a27df7f7ce5a66e6c6b557760'; // Coloque sua chave API aqui
    const geocodeUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&lang=pt_br&units=metric`;

    const respostaGeocode = await fetch(geocodeUrl);
    const dadosGeocode = await respostaGeocode.json();

    if (dadosGeocode.cod !== 200) {
      resultado.innerHTML = "<p>❌ Cidade não encontrada!</p>";
      mapaDiv.innerHTML = "";
      return;
    }

    const { lat, lon } = dadosGeocode.coord;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=pt_br`;
    const respostaForecast = await fetch(forecastUrl);
    const dadosForecast = await respostaForecast.json();

    const iconeClima = `https://openweathermap.org/img/wn/${dadosGeocode.weather[0].icon}@2x.png`;
    const descricao = dadosGeocode.weather[0].description;
    const temperatura = dadosGeocode.main.temp;
    const umidade = dadosGeocode.main.humidity;
    const vento = dadosGeocode.wind.speed;

    const horarioLocal = new Date((dadosGeocode.dt + dadosGeocode.timezone) * 1000);
    const horarioFormatado = horarioLocal.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

    let previsaoHTML = `
        <h2>${dadosGeocode.name}, ${dadosGeocode.sys.country}</h2>
        <img src="${iconeClima}" alt="Ícone do clima">
        <p style="margin-top: -10px;">${descricao.charAt(0).toUpperCase() + descricao.slice(1)}</p>
        <p>🌡️ Temperatura: ${temperatura.toFixed(1)}°C</p>
        <p>💧 Umidade: ${umidade}%</p>
        <p>💨 Vento: ${vento} m/s</p>
        <p>🕒 Horário local: ${horarioFormatado}</p>
        <div id="previsao">
    `;

    const previsoesPorDia = {};
    for (let item of dadosForecast.list) {
      const data = new Date(item.dt * 1000);
      const diaChave = data.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });

      if (!previsoesPorDia[diaChave]) {
        previsoesPorDia[diaChave] = {
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          icone: item.weather[0].icon
        };
      } else {
        previsoesPorDia[diaChave].tempMax = Math.max(previsoesPorDia[diaChave].tempMax, item.main.temp_max);
        previsoesPorDia[diaChave].tempMin = Math.min(previsoesPorDia[diaChave].tempMin, item.main.temp_min);
      }
    }

    let count = 0;
    let pulouHoje = false;
    for (let dia in previsoesPorDia) {
      if (!pulouHoje) {
        pulouHoje = true;
        continue;
      }

      if (count >= 4) break;

      const { tempMax, tempMin, icone } = previsoesPorDia[dia];

      previsaoHTML += `
          <div>
              <p><strong>${dia}</strong></p>
              <img src="https://openweathermap.org/img/wn/${icone}@2x.png" alt="Ícone do clima" style="width: 50px; height: 50px;">
              <p>↑ ${tempMax.toFixed(1)}°C</p>
              <p>↓ ${tempMin.toFixed(1)}°C</p>
          </div>
      `;
      count++;
    }

    previsaoHTML += `</div>`;
    resultado.innerHTML = previsaoHTML;

    // MAPA
    if (!mapa) {
      mapa = L.map('mapa').setView([lat, lon], 10);

      camadaClaro = L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=Q4UpyLdIbl2R7GwxfwRz', {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
      });

      camadaEscuro = L.tileLayer('https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=Q4UpyLdIbl2R7GwxfwRz', {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
      });

      camadaClaro.addTo(mapa);
    } else {
      mapa.setView([lat, lon], 10);
    }

    // Atualiza o marcador
    if (marcador) {
      marcador.setLatLng([lat, lon]);
    } else {
      marcador = L.marker([lat, lon]).addTo(mapa);
    }

    // Atualiza camada de mapa conforme tema atual
    const modoEscuroAtivo = document.body.classList.contains('modo-escuro');
    alternarModoMapa(modoEscuroAtivo);

  } catch (erro) {
    resultado.innerHTML = "<p>❌ Erro ao buscar clima.</p>";
    console.error("Erro na API:", erro);
  }
}

function alternarModoMapa(modoEscuro) {
  if (!mapa || !camadaClaro || !camadaEscuro) return;

  if (modoEscuro) {
    if (mapa.hasLayer(camadaClaro)) mapa.removeLayer(camadaClaro);
    if (!mapa.hasLayer(camadaEscuro)) mapa.addLayer(camadaEscuro);
  } else {
    if (mapa.hasLayer(camadaEscuro)) mapa.removeLayer(camadaEscuro);
    if (!mapa.hasLayer(camadaClaro)) mapa.addLayer(camadaClaro);
  }
}

window.addEventListener('offline', () => {
  alert("Você está offline! Algumas funções podem não funcionar.");
});

window.addEventListener('online', () => {
  alert("Conexão restaurada!");
});