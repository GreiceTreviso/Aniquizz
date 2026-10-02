function iniciarCronometro() {
  pararCronometro(); // garante que nunca existam dois relógios ao mesmo tempo

  idDoTimer = setInterval(() => {
    const jogadorDoTique = jogadorAtual;

    tempos[jogadorDoTique]--;
    mostrarTempoDaVez();

    if (tempos[jogadorDoTique] <= 0) {
      tirarJogadorDoJogo(jogadorDoTique, "tempo");
    }
  }, 1000);
}

function pararCronometro() {
  clearInterval(idDoTimer);
  idDoTimer = null;
}

// Tira um jogador da partida (tempo ou erros acabaram).
// - 1 jogador: derrota na hora.
// - 2 jogadores: ele só fica "fora" e a vez passa para o outro. Se os dois
//   ficarem fora, a partida termina e a tela mostra quantos pares cada um fez.
function tirarJogadorDoJogo(indice, motivo) {
  if (numeroDeJogadores === 1) {
    finalizarJogo(motivo);
    return;
  }

  foraDeJogo[indice] = true;
  const outroJogador = indice === 0 ? 1 : 0;

  if (foraDeJogo[outroJogador]) {
    finalizarJogo("placar");
    return;
  }

  if (jogadorAtual === indice) {
    // Se ele tinha virado só UMA carta, ela desvira antes de passar a vez.
    if (primeiraCarta && !segundaCarta) {
      primeiraCarta.classList.remove("carta--virada");
      primeiraCarta = null;
    }

    jogadorAtual = outroJogador;
    destacarJogadorDaVez();
    mostrarTempoDaVez();
  }
}

/* ---------- PASSO 11: Pausa (popover nativo) ----------
   O menu de pausa já abre/fecha sozinho (atributo popover no HTML).
   Aqui só escutamos o evento "toggle" para pausar/continuar o jogo. */

function pausar() {
  jogoPausado = true;
  pararCronometro();
  tabuleiro.classList.add("tabuleiro--travado");
}

function continuar() {
  jogoPausado = false;
  tabuleiro.classList.remove("tabuleiro--travado");
  iniciarCronometro();
}

if (menuPausa) {
  menuPausa.addEventListener("toggle", (evento) => {
    if (jogoTerminado || emPrevia) return;
    evento.newState === "open" ? pausar() : continuar();
  });
}