/* ---------- Fundo sorteado a cada partida ---------- */
const fundosDoJogo = [
  "assets/img/fundo-jogo-1.jpg",
  "assets/img/fundo-jogo-2.jpg",
  "assets/img/fundo-jogo-3.jpg",
  "assets/img/fundo-jogo-4.jpg",
  "assets/img/fundo-jogo-5.jpg",
];

function sortearFundo() {
  const fundo = fundosDoJogo[Math.floor(Math.random() * fundosDoJogo.length)];
  // Endereço completo: uma url() dentro de variável CSS é resolvida a partir da pasta css/,
  // então o caminho relativo ao jogo.html não funcionaria.
  const endereco = new URL(fundo, document.baseURI).href;
  document.querySelector(".tela--jogo").style.setProperty("--fundo-jogo", `url("${endereco}")`);
}

function iniciarJogo() {
  sortearFundo();
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