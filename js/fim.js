function finalizarJogo(motivo) {
  jogoTerminado = true;
  pararCronometro();
  tabuleiro.classList.add("tabuleiro--travado");

  if (numeroDeJogadores === 2) {
    mostrarPlacarFinalDeDoisJogadores(); // sempre mostra quem marcou quantos
  } else if (motivo === "vitoria") {
    mostrarTelaDeVitoria();
  } else {
    mostrarTelaDeDerrota(motivo);
  }

  painelFim.showPopover();
}

// Troca o tema do painel (cor do título) entre vitória e derrota.
function definirTemaDoPainel(tema) {
  painelFim.classList.remove("painel-fim--vitoria", "painel-fim--derrota");
  painelFim.classList.add(`painel-fim--${tema}`);
}

// Modo 2 jogadores: mostra quem venceu e quantos pares cada um marcou.
function mostrarPlacarFinalDeDoisJogadores() {
  definirTemaDoPainel("vitoria");

  const [jogador1, jogador2] = placar;

  if (jogador1.pontos === jogador2.pontos) {
    painelFimTitulo.textContent = "🤝 It's a Tie!";
  } else {
    const vencedor = jogador1.pontos > jogador2.pontos ? 1 : 2;
    painelFimTitulo.textContent = `🏆 Player ${vencedor} wins!`;
  }

  painelFimResultado.textContent =
    `Player 1: ${jogador1.pontos} pairs\nPlayer 2: ${jogador2.pontos} pairs`;

  painelFimRecorde.hidden = true; // recorde só vale no modo 1 jogador
}

function mostrarTelaDeVitoria() {
  definirTemaDoPainel("vitoria");
  painelFimTitulo.textContent = "🏆 Victory!";
  painelFimResultado.textContent = `You found all ${placar[0].pontos} pairs!`;

  painelFimRecorde.hidden = !verificarRecorde(tempos[0]);
}

function mostrarTelaDeDerrota(motivo) {
  definirTemaDoPainel("derrota");
  painelFimTitulo.textContent = "💀 You lost";

  painelFimResultado.textContent = motivo === "tempo"
    ? "The time is up. Game over."
    : "You ran out of moves. Game over.";

  painelFimRecorde.hidden = true;
}

/* ---------- PASSO 14: Extras ---------- */

// Toca um som sem quebrar o jogo se o arquivo não existir ou o navegador bloquear.
function tocarSom(som) {
  try {
    som.currentTime = 0;
    som.play().catch(() => {});
  } catch {
    // ignora: arquivo ausente, autoplay bloqueado, etc.
  }
}

// Recorde por dificuldade: quanto mais tempo sobrou ao vencer, melhor a partida.
// Guardado no localStorage, então sobrevive a recarregar a página.
function verificarRecorde(tempoFinal) {
  try {
    const chave = `aniquizz-recorde-${nomeDificuldade}`;
    const recordeAnterior = Number(localStorage.getItem(chave)) || 0;

    if (tempoFinal > recordeAnterior) {
      localStorage.setItem(chave, tempoFinal);
      return true;
    }
  } catch {
    // localStorage pode estar bloqueado (modo anônimo, etc.): sem recorde, sem quebrar o jogo
  }

  return false;
}