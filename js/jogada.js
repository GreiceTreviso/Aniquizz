// Escreve pontos/erros de cada jogador nos elementos do HTML.
// Chamada sempre que alguém acerta ou erra um par.
function atualizarPlacar() {
  placar.forEach((dados, indice) => {
    if (!camposPontos[indice]) return; // o HTML pode ter só um placar

    camposPontos[indice].textContent = dados.pontos;
    camposErros[indice].textContent = dados.erros;
  });

  // Quem ficou sem erros sai do jogo (1 jogador: derrota; 2 jogadores: o outro segue).
  for (let indice = 0; indice < numeroDeJogadores; indice++) {
    if (jogoTerminado) break;
    if (placar[indice].erros <= 0 && !foraDeJogo[indice]) {
      tirarJogadorDoJogo(indice, "erros");
    }
  }
}

/* ---------- PASSO 6: Clique ---------- */

function aoClicarNoTabuleiro(evento) {
  if (tabuleiro.classList.contains("tabuleiro--travado")) return; // teclado ignora o pointer-events do CSS

  const carta = evento.target.closest(".carta");
  if (!carta || carta.classList.contains("carta--virada")) return;

  carta.classList.add("carta--virada");

  if (!primeiraCarta) {
    primeiraCarta = carta;
    return;
  }

  segundaCarta = carta;
  tabuleiro.classList.add("tabuleiro--travado"); // bloqueia cliques durante a comparação
  compararPar();
}

/* ---------- PASSO 7: Comparar o par ---------- */

function compararPar() {
  const acertou = primeiraCarta.dataset.par === segundaCarta.dataset.par;

  // Guarda quem fez a jogada: se o tempo dele zerar durante a espera,
  // jogadorAtual já terá mudado, mas o ponto/erro continua sendo dele.
  const jogadorDaJogada = jogadorAtual;

  setTimeout(() => {
    if (jogoTerminado) return; // o jogo acabou durante a espera (ex.: tempo zerou)

    if (acertou) {
      primeiraCarta.classList.add("carta--removida", "carta--acertou");
      segundaCarta.classList.add("carta--removida", "carta--acertou");
      tocarSom(SOM_ACERTO);

      paresEncontrados++;
      placar[jogadorDaJogada].pontos++;
      tempos[jogadorDaJogada] += configuracao.bonus; // bônus só no relógio de quem acertou
    } else {
      primeiraCarta.classList.remove("carta--virada");
      segundaCarta.classList.remove("carta--virada");
      tocarSom(SOM_ERRO);

      placar[jogadorDaJogada].erros--;
    }

    primeiraCarta = null;
    segundaCarta = null;
    if (!jogoPausado) tabuleiro.classList.remove("tabuleiro--travado");

    atualizarPlacar();
    mostrarTempoDaVez();

    if (jogoTerminado) return; // atualizarPlacar() já pode ter encerrado o jogo

    // Acabaram as cartas: fim de jogo.
    if (paresEncontrados === configuracao.pares) {
      finalizarJogo("vitoria");
      return;
    }

    // PASSO 8: no modo 2 jogadores, só troca a vez quando erra.
    // Quem acerta continua jogando.
    if (!acertou) {
      trocarDeJogador();
    }
  }, acertou ? ATRASO_ACERTO : ATRASO_ERRO);
}

/* ---------- PASSO 8: Turnos (modo 2 jogadores) ---------- */

// No modo 1 jogador isso nunca troca nada, porque só existe o jogador 0.
function trocarDeJogador() {
  if (numeroDeJogadores < 2) return;

  const outroJogador = jogadorAtual === 0 ? 1 : 0;
  if (foraDeJogo[outroJogador]) return; // o outro já saiu: continua com quem está jogando

  jogadorAtual = outroJogador;
  destacarJogadorDaVez();
  mostrarTempoDaVez();
}