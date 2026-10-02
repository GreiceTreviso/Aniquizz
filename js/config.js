const DIFICULDADES = {
  easy:   { pares: 8,  tempo: { 1: 60, 2: 60 }, bonus: 5, erros: 25 },
  normal: { pares: 12, tempo: { 1: 40, 2: 40 }, bonus: 4, erros: 20 },
  hard:   { pares: 16, tempo: { 1: 30, 2: 30 }, bonus: 3, erros: 15 },
};

const DIFICULDADE_PADRAO = "normal"; // se abrir jogo.html sem passar pela escolha
const COLUNAS_TELA_DEITADA = 8;
const COLUNAS_TELA_EM_PE = 4;

const ATRASO_ACERTO = 600; // ms que o par certo fica à vista antes de sumir
const ATRASO_ERRO = 900;   // ms que o par errado fica à vista antes de desvirar

// Por quanto tempo (ms) as cartas ficam viradas no início para o
// jogador memorizar. O relógio só começa a correr depois disso.
const TEMPO_PREVIA = 2000;

// Animação de embaralhamento das cartas (ms). Precisa bater com a
// duração de "carta-embaralhar" no jogo.css (1.4s) + o atraso escalonado.
const TEMPO_EMBARALHAR = 1700;

// PASSO 14: sons de acerto e erro. Coloque os arquivos em assets/audio/
// (se o arquivo não existir, tocarSom() só ignora o erro, sem travar o jogo).
const SOM_ACERTO = new Audio("assets/audio/acerto.mp3");
const SOM_ERRO = new Audio("assets/audio/erro.mp3");