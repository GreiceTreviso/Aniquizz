function iniciarJogo() {
  jogoTerminado = false;
  jogoPausado = false;
  primeiraCarta = null;
  segundaCarta = null;
  jogadorAtual = 0;
  paresEncontrados = 0;
  foraDeJogo = [false, false];
  placar = [
    { pontos: 0, erros: configuracao.erros },
    { pontos: 0, erros: configuracao.erros },
  ];
  tempos = [tempoInicial, tempoInicial];

  esconderCartasExtras();
  ajustarGrade();
  mostrarConfiguracaoNoPlacar();
  montarTabuleiro();
  destacarJogadorDaVez();
  atualizarPlacar();

  pararCronometro();
  embaralharComAnimacao(mostrarPreviaDasCartas); // embaralha -> prévia -> cronômetro
}

/* ---------- Início ---------- */
iniciarJogo();

tabuleiro.addEventListener("click", aoClicarNoTabuleiro);

// Se o aparelho girar, o CSS troca 8x4 por 4x8: a grade acompanha.
telaEmPe.addEventListener("change", ajustarGrade);