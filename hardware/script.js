/* =========================================================
   Dados dos componentes
   (coordenadas em % relativas à imagem do gabinete)
========================================================= */
const COMPONENTES = [
  {
    id: 1,
    key: "psu",
    nome: "Fonte de alimentação",
    icone: "🔌",
    top: 12.6,
    left: 8,
    explicacao: "A fonte de alimentação converte a energia elétrica da tomada em energia adequada para alimentar todos os componentes internos do computador. Neste caso, é uma fonte de 650W."
  },
  {
    id: 2,
    key: "cpu",
    nome: "Processador (CPU)",
    icone: "🧠",
    top: 35.6,
    left: 33,
    explicacao: "O processador é o cérebro do computador. Ele executa as instruções dos programas e coordena todas as operações do sistema. O cooler visto na imagem serve para resfriá-lo."
  },
  {
    id: 3,
    key: "ram",
    nome: "Memória RAM",
    icone: "⚡",
    top: 35.6,
    left: 55,
    explicacao: "A memória RAM guarda temporariamente os dados que o computador está usando no momento, permitindo acesso rápido enquanto os programas estão em execução."
  },
  {
    id: 4,
    key: "gpu",
    nome: "Placa de vídeo (GPU)",
    icone: "🎮",
    top: 55.3,
    left: 8,
    explicacao: "A placa de vídeo processa gráficos e imagens. É essencial para jogos, edição de vídeo e outras tarefas visuais mais pesadas."
  },
  {
    id: 5,
    key: "mobo",
    nome: "Placa-mãe",
    icone: "🧩",
    top: 68.7,
    left: 50,
    explicacao: "A placa-mãe conecta todos os componentes entre si, permitindo que processador, memória, armazenamento e demais peças se comuniquem."
  },
  {
    id: 6,
    key: "ssd",
    nome: "SSD (Armazenamento)",
    icone: "💽",
    top: 79.9,
    left: 65,
    explicacao: "O SSD é uma unidade de armazenamento que guarda permanentemente o sistema operacional, os programas e os arquivos, com velocidade muito maior que discos rígidos tradicionais (HD)."
  }
];

/* =========================================================
   Estado do jogo
========================================================= */
const estado = {
  acertos: 0,
  tentativas: 0,
  pontos: 0,
  tempoInicio: null,
  cronometroId: null,
  finalizado: false,
  selecionado: null // key do componente selecionado (modo toque)
};

/* =========================================================
   Referências DOM
========================================================= */
const board = document.getElementById("board");
const boardImg = document.getElementById("boardImg");
const listaComponentes = document.getElementById("componentes");
const colecaoGrade = document.getElementById("colecaoGrade");
const contador = document.getElementById("contador");
const progresso = document.getElementById("progresso");
const feedback = document.getElementById("feedback");
const elTempo = document.getElementById("tempo");
const elPontos = document.getElementById("pontos");
const elTentativas = document.getElementById("tentativas");

const modal = document.getElementById("modal");
const modalIcone = document.getElementById("modal-icone");
const modalTitulo = document.getElementById("modal-titulo");
const modalTexto = document.getElementById("modal-texto");
const modalEstrelas = document.getElementById("modal-estrelas");
const modalTempo = document.getElementById("modal-tempo");
const modalPontos = document.getElementById("modal-pontos");
const modalTentativas = document.getElementById("modal-tentativas");
const confeteCamada = document.getElementById("confete");

/* =========================================================
   Construção da interface
========================================================= */
function montarPinos() {
  board.querySelectorAll(".pin").forEach(p => p.remove());
  COMPONENTES.forEach(c => {
    const pin = document.createElement("button");
    pin.className = "pin";
    pin.type = "button";
    pin.dataset.key = c.key;
    pin.style.top = c.top + "%";
    pin.style.left = c.left + "%";
    pin.textContent = c.id;
    pin.setAttribute("aria-label", `Local ${c.id}. Ainda não identificado.`);
    pin.addEventListener("click", () => aoClicarPino(c.key));
    board.appendChild(pin);
  });
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function montarListaComponentes() {
  listaComponentes.innerHTML = "";
  embaralhar(COMPONENTES).forEach(c => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "componente";
    item.dataset.key = c.key;
    item.setAttribute("draggable", "false");
    item.innerHTML = `
      <span class="icone">${c.icone}</span>
      <span>${c.nome}</span>
      <b>⠿</b>
    `;
    item.addEventListener("click", () => aoClicarComponente(c.key));
    item.addEventListener("pointerdown", e => iniciarPossivelArraste(e, item, c.key));
    listaComponentes.appendChild(item);
  });
}

function montarColecao() {
  colecaoGrade.innerHTML = "";
  COMPONENTES.forEach(c => {
    const carta = document.createElement("div");
    carta.className = "carta-componente";
    carta.dataset.key = c.key;
    carta.innerHTML = `
      <div class="icn">❔</div>
      <div>
        <h3>Componente ${c.id}</h3>
        <p>Acerte este local para desbloquear a explicação.</p>
      </div>
    `;
    colecaoGrade.appendChild(carta);
  });
}

/* =========================================================
   Cronômetro
========================================================= */
function formatarTempo(segundosTotais) {
  const m = Math.floor(segundosTotais / 60).toString().padStart(2, "0");
  const s = Math.floor(segundosTotais % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function iniciarCronometroSeNecessario() {
  if (estado.tempoInicio || estado.finalizado) return;
  estado.tempoInicio = Date.now();
  estado.cronometroId = setInterval(() => {
    const decorridos = (Date.now() - estado.tempoInicio) / 1000;
    elTempo.textContent = formatarTempo(decorridos);
  }, 250);
}

function pararCronometro() {
  clearInterval(estado.cronometroId);
  estado.cronometroId = null;
}

function tempoDecorridoSegundos() {
  if (!estado.tempoInicio) return 0;
  return (Date.now() - estado.tempoInicio) / 1000;
}

/* =========================================================
   Feedback textual
========================================================= */
let feedbackTimeoutId = null;
function mostrarFeedback(mensagem, tipo) {
  clearTimeout(feedbackTimeoutId);
  feedback.textContent = mensagem;
  feedback.className = `feedback ativo ${tipo}`;
  feedbackTimeoutId = setTimeout(() => {
    feedback.className = "feedback";
  }, 2600);
}

/* =========================================================
   Seleção (modo toque: seleciona item, depois toca no pino)
========================================================= */
function limparSelecao() {
  estado.selecionado = null;
  document.querySelectorAll(".componente.selecionado")
    .forEach(el => el.classList.remove("selecionado"));
  document.querySelectorAll(".pin.alvo-pronto")
    .forEach(el => el.classList.remove("alvo-pronto"));
}

function aoClicarComponente(key) {
  const item = listaComponentes.querySelector(`.componente[data-key="${key}"]`);
  if (!item || item.classList.contains("usado")) return;

  if (estado.selecionado === key) {
    limparSelecao();
    return;
  }

  limparSelecao();
  estado.selecionado = key;
  item.classList.add("selecionado");
  board.querySelectorAll(".pin:not(.correto)").forEach(p => p.classList.add("alvo-pronto"));
  mostrarFeedback("Agora toque no número correspondente na imagem.", "info");
}

function aoClicarPino(key) {
  if (!estado.selecionado) {
    const pin = board.querySelector(`.pin[data-key="${key}"]`);
    if (pin && !pin.classList.contains("correto")) {
      mostrarFeedback("Selecione um componente na lista à direita primeiro.", "info");
    }
    return;
  }
  tentarColocar(estado.selecionado, key);
  limparSelecao();
}

/* =========================================================
   Arrastar (mouse, caneta e toque via Pointer Events)
========================================================= */
function iniciarPossivelArraste(e, item, key) {
  if (item.classList.contains("usado")) return;
  if (e.button !== undefined && e.button !== 0) return;

  const origemX = e.clientX;
  const origemY = e.clientY;
  let arrastando = false;
  let clone = null;

  function aoMover(ev) {
    const dx = ev.clientX - origemX;
    const dy = ev.clientY - origemY;

    if (!arrastando && Math.hypot(dx, dy) > 8) {
      arrastando = true;
      limparSelecao();
      clone = document.createElement("div");
      clone.className = "arrastando-clone";
      clone.textContent = item.textContent.trim();
      document.body.appendChild(clone);
      item.style.opacity = ".4";
      board.querySelectorAll(".pin:not(.correto)").forEach(p => p.classList.add("alvo-pronto"));
    }

    if (arrastando && clone) {
      clone.style.left = ev.clientX + "px";
      clone.style.top = ev.clientY + "px";
    }
  }

  function aoSoltar(ev) {
    document.removeEventListener("pointermove", aoMover);
    document.removeEventListener("pointerup", aoSoltar);
    document.removeEventListener("pointercancel", aoSoltar);

    item.style.opacity = "";
    board.querySelectorAll(".pin.alvo-pronto").forEach(p => p.classList.remove("alvo-pronto"));

    if (clone) clone.remove();

    if (arrastando) {
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY);
      const pino = alvo ? alvo.closest(".pin") : null;
      if (pino) {
        tentarColocar(key, pino.dataset.key);
      }
    }
  }

  document.addEventListener("pointermove", aoMover);
  document.addEventListener("pointerup", aoSoltar);
  document.addEventListener("pointercancel", aoSoltar);
}

/* =========================================================
   Lógica principal: tentar colocar um componente num pino
========================================================= */
function tentarColocar(keyComponente, keyPino) {
  if (estado.finalizado) return;

  const pin = board.querySelector(`.pin[data-key="${keyPino}"]`);
  if (!pin || pin.classList.contains("correto")) return;

  iniciarCronometroSeNecessario();

  const componente = COMPONENTES.find(c => c.key === keyComponente);
  const item = listaComponentes.querySelector(`.componente[data-key="${keyComponente}"]`);
  if (!componente || !item || item.classList.contains("usado")) return;

  estado.tentativas++;
  elTentativas.textContent = estado.tentativas;

  if (keyComponente === keyPino) {
    // Acerto
    estado.acertos++;
    estado.pontos += 100;
    atualizarPontos();

    pin.classList.remove("incorreto");
    pin.classList.add("correto");
    pin.innerHTML = componente.icone;
    pin.setAttribute("aria-label", `Local ${componente.id}: ${componente.nome}, identificado corretamente.`);

    item.classList.add("usado");

    desbloquearCarta(componente);
    mostrarFeedback(`✅ Correto! Isto é: ${componente.nome}.`, "sucesso");

    atualizarProgresso();
    tocarSom("acerto");

    if (estado.acertos === COMPONENTES.length) {
      finalizarJogo();
    }
  } else {
    // Erro
    estado.pontos = Math.max(0, estado.pontos - 15);
    atualizarPontos();

    pin.classList.remove("correto");
    pin.classList.add("incorreto");
    setTimeout(() => pin.classList.remove("incorreto"), 400);

    mostrarFeedback(`❌ "${componente.nome}" não é esse local. Tente novamente!`, "erro");
    tocarSom("erro");
  }
}

function atualizarPontos() {
  elPontos.textContent = estado.pontos;
}

function desbloquearCarta(componente) {
  const carta = colecaoGrade.querySelector(`.carta-componente[data-key="${componente.key}"]`);
  if (!carta) return;
  carta.classList.add("desbloqueada");
  carta.innerHTML = `
    <div class="icn">${componente.icone}</div>
    <div>
      <h3>${componente.nome}</h3>
      <p>${componente.explicacao}</p>
    </div>
  `;
}

function atualizarProgresso() {
  contador.textContent = `${estado.acertos} de ${COMPONENTES.length} identificados`;
  progresso.style.width = `${(estado.acertos / COMPONENTES.length) * 100}%`;
}

/* =========================================================
   Som simples via Web Audio (sem arquivos externos)
========================================================= */
let audioCtx = null;
function tocarSom(tipo) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (tipo === "acerto") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(990, audioCtx.currentTime + 0.12);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    }

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (err) {
    /* áudio indisponível — ignora silenciosamente */
  }
}

/* =========================================================
   Verificar respostas (botão manual)
========================================================= */
document.getElementById("verificar").addEventListener("click", () => {
  if (estado.finalizado) return;

  const faltam = COMPONENTES.length - estado.acertos;
  if (faltam === 0) {
    finalizarJogo();
    return;
  }

  board.querySelectorAll(".pin:not(.correto)").forEach(pin => {
    pin.classList.add("incorreto");
    setTimeout(() => pin.classList.remove("incorreto"), 450);
  });

  mostrarFeedback(`Ainda faltam ${faltam} componente(s) para identificar. Continue tentando!`, "info");
});

/* =========================================================
   Reiniciar
========================================================= */
document.getElementById("reiniciar").addEventListener("click", reiniciarJogo);

function reiniciarJogo() {
  pararCronometro();
  estado.acertos = 0;
  estado.tentativas = 0;
  estado.pontos = 0;
  estado.tempoInicio = null;
  estado.finalizado = false;
  estado.selecionado = null;

  elTempo.textContent = "00:00";
  elPontos.textContent = "0";
  elTentativas.textContent = "0";
  feedback.className = "feedback";

  montarPinos();
  montarListaComponentes();
  montarColecao();
  atualizarProgresso();

  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
}

/* =========================================================
   Finalização / modal de resultado
========================================================= */
function calcularEstrelas() {
  if (estado.tentativas <= COMPONENTES.length) return 3;
  if (estado.tentativas <= COMPONENTES.length + 3) return 2;
  return 1;
}

function finalizarJogo() {
  estado.finalizado = true;
  pararCronometro();

  const tempoFinal = tempoDecorridoSegundos();
  let bonus = 0;
  if (tempoFinal <= 45) bonus = 60;
  else if (tempoFinal <= 90) bonus = 30;
  if (bonus > 0) {
    estado.pontos += bonus;
    atualizarPontos();
  }

  const estrelas = calcularEstrelas();

  modalIcone.textContent = "🏆";
  modalTitulo.textContent = "Parabéns, você completou o desafio!";
  modalEstrelas.innerHTML = "★★★".split("").map((s, i) =>
    `<span class="${i < estrelas ? "cheia" : ""}">★</span>`
  ).join("");

  let texto = `Você identificou corretamente todos os ${COMPONENTES.length} componentes do computador.`;
  if (bonus > 0) texto += ` Bônus de velocidade: +${bonus} pontos!`;
  modalTexto.textContent = texto;

  modalTempo.textContent = formatarTempo(tempoFinal);
  modalPontos.textContent = estado.pontos;
  modalTentativas.textContent = estado.tentativas;

  modal.classList.add("ativo");
  modal.setAttribute("aria-hidden", "false");

  lancarConfete();
}

document.getElementById("fechar-modal").addEventListener("click", () => {
  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
  reiniciarJogo();
});

modal.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
  }
});

/* =========================================================
   Confete de celebração
========================================================= */
function lancarConfete() {
  const cores = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];
  for (let i = 0; i < 70; i++) {
    const pedaco = document.createElement("div");
    pedaco.className = "confete-pedaco";
    pedaco.style.left = Math.random() * 100 + "vw";
    pedaco.style.background = cores[Math.floor(Math.random() * cores.length)];
    pedaco.style.animationDuration = 2.2 + Math.random() * 1.6 + "s";
    pedaco.style.animationDelay = Math.random() * 0.4 + "s";
    confeteCamada.appendChild(pedaco);
    setTimeout(() => pedaco.remove(), 4500);
  }
}

/* =========================================================
   Inicialização
========================================================= */
montarPinos();
montarListaComponentes();
montarColecao();
atualizarProgresso();
