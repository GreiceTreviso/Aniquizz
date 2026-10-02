if (typeof cartas === "undefined") {
  throw new Error(
    'estado.js: o json.js não foi carregado. No jogo.html, coloque ' +
    '<script src="js/json.js" defer></script> ANTES dos scripts do jogo.'
  );
}

/* Opções da partida */
const raiz = document.documentElement;

const nomeDificuldade = Object.hasOwn(DIFICULDADES, raiz.dataset.dificuldade)
  ? raiz.dataset.dificuldade
  : DIFICULDADE_PADRAO;

raiz.dataset.dificuldade = nomeDificuldade;

const numeroDeJogadores = raiz.dataset.jogadores === "2" ? 2 : 1; // qualquer outra coisa = 1
const configuracao = DIFICULDADES[nomeDificuldade];
const totalDeCartas = configuracao.pares * 2;
const tempoInicial = configuracao.tempo[numeroDeJogadores]; // segundos de cada jogador

/* ---------- PASSO 3: Dados e elementos da tela ----------
   "cartas" (do json.js) pode ser uma lista simples ou uma lista dentro
   de outra lista (como está hoje). O nome "cartas" já é do json.js,
   por isso as cartas do HTML se chamam "cartasNoTabuleiro". */
const personagens = Array.isArray(cartas[0]) ? cartas[0] : cartas;

const tabuleiro = document.getElementById("tabuleiro");
const cartasNoTabuleiro = [...tabuleiro.querySelectorAll(".carta")];
const campoTempo = document.getElementById("tempo"); // mostra o tempo de quem está jogando
const camposErros = [
  document.getElementById("erros-jogador-1"),
  document.getElementById("erros-jogador-2"),
];
const camposPontos = [
  document.getElementById("pontos-jogador-1"),
  document.getElementById("pontos-jogador-2"),
];
const menuPausa = document.getElementById("menu-pausa");
const painelFim = document.getElementById("painel-fim");
const painelFimTitulo = document.getElementById("titulo-fim");
const painelFimResultado = document.getElementById("painel-fim-resultado");
const painelFimRecorde = document.getElementById("painel-fim-recorde");

const telaEmPe = window.matchMedia("(orientation: portrait)");

// Aviso de que os erros de cada jogador precisam ter o seu próprio campo no HTML.
if (camposErros[0] && camposErros[0] === camposErros[1]) {
  console.warn("estado.js: erros-jogador-1 e erros-jogador-2 apontam para o MESMO elemento. Confira os ids no HTML.");
}

/* ---------- Estado da jogada ---------- */
let primeiraCarta = null;
let segundaCarta = null;

/* ---------- PASSO 4: Estado geral da partida ----------
   jogadorAtual: 0 = jogador 1, 1 = jogador 2 (bate com os índices
   dos arrays camposPontos/camposErros acima).
   No modo 1 jogador, jogadorAtual fica sempre 0. */
let jogadorAtual = 0;

// Um objeto de placar por jogador, em vez de variáveis soltas.
let placar = [
  { pontos: 0, erros: configuracao.erros },
  { pontos: 0, erros: configuracao.erros },
];

// Cada jogador tem o SEU relógio, que só corre na vez dele.
let tempos = [tempoInicial, tempoInicial];

// No modo 2 jogadores, ficar sem tempo (ou sem erros) não encerra a partida:
// o jogador só fica "fora" e o outro continua até acabarem as cartas.
// foraDeJogo[i] === true = o jogador i não joga mais.
let foraDeJogo = [false, false];

let paresEncontrados = 0; // usado no Passo 12 para saber se acabaram as cartas
let idDoTimer = null;     // vai guardar o retorno do setInterval (Passo 10)

let emPrevia = false; // true durante a animação de embaralhar e a prévia das cartas
let jogoPausado = false;
let jogoTerminado = false;