/* ==========================================================
   jogo.js — regras do Jogo da Memória de Animes

   Passo 2: ler as opções e configurar a dificuldade.
   Passo 5: sortear os personagens do json.js e montar o tabuleiro.
   Passo 6: virar as cartas ao clicar.
   Passo 7 (parte): comparar o par (ainda sem pontos, erros e tempo).

   Depende de (nesta ordem): opcoes.js, json.js, jogo.js.
   - opcoes.js grava data-jogadores e data-dificuldade no <html>.
   - json.js cria a lista "cartas" com os personagens.
   ========================================================== */

/* ---------- Configuração por dificuldade ----------
   pares: quantos pares de cartas entram na partida
   tempo: segundos no relógio quando a partida começa
   bonus: segundos ganhos a cada par encontrado
   erros: erros permitidos por jogador

   Nº de cartas = pares x 2. Os valores 16, 24 e 32 dividem certinho
   por 8 e por 4 colunas (tela deitada e em pé), sem sobrar espaço. */
const DIFICULDADES = {
  easy:   { pares: 8,  tempo: 30, bonus: 5, erros: 10 },
  normal: { pares: 12, tempo: 20, bonus: 4, erros: 8 },
  hard:   { pares: 16, tempo: 15, bonus: 3, erros: 5 },
};

const DIFICULDADE_PADRAO = "normal"; // se abrir jogo.html sem passar pela escolha
const COLUNAS_TELA_DEITADA = 8;
const COLUNAS_TELA_EM_PE = 4;

const ATRASO_ACERTO = 600; // ms que o par certo fica à vista antes de sumir
const ATRASO_ERRO = 900;   // ms que o par errado fica à vista antes de desvirar

/* ---------- Verificação: o json.js precisa ter sido carregado ---------- */
if (typeof cartas === "undefined") {
  throw new Error(
    'jogo.js: o json.js não foi carregado. No jogo.html, coloque ' +
    '<script src="js/json.js" defer></script> ANTES do jogo.js.'
  );
}

/* ---------- Opções da partida ---------- */
const raiz = document.documentElement;

const nomeDificuldade = Object.hasOwn(DIFICULDADES, raiz.dataset.dificuldade)
  ? raiz.dataset.dificuldade
  : DIFICULDADE_PADRAO;

raiz.dataset.dificuldade = nomeDificuldade;

const numeroDeJogadores = Number(raiz.dataset.jogadores); // 1 ou 2 (opcoes.js assume 1)
const configuracao = DIFICULDADES[nomeDificuldade];
const totalDeCartas = configuracao.pares * 2;

/* ---------- Dados e elementos da tela ----------
   "cartas" (do json.js) pode ser uma lista simples ou uma lista dentro
   de outra lista (como está hoje). O nome "cartas" já é do json.js,
   por isso as cartas do HTML se chamam "cartasNoTabuleiro". */
const personagens = Array.isArray(cartas[0]) ? cartas[0] : cartas;

const tabuleiro = document.getElementById("tabuleiro");
const cartasNoTabuleiro = [...tabuleiro.querySelectorAll(".carta")];
const campoTempo = document.getElementById("tempo");
const camposErros = [
  document.getElementById("erros-jogador-1"),
  document.getElementById("erros-jogador-2"),
];

const telaEmPe = window.matchMedia("(orientation: portrait)");

/* ---------- Estado da jogada ---------- */
let primeiraCarta = null;
let segundaCarta = null;

/* ---------- Configuração da tela ---------- */

// Cartas além do necessário saem da tela (display: none via atributo hidden).
function esconderCartasExtras() {
  cartasNoTabuleiro.forEach((carta, indice) => {
    carta.hidden = indice >= totalDeCartas;
  });
}

// O CSS calcula o tamanho das cartas a partir de --colunas e --linhas.
function ajustarGrade() {
  const colunas = telaEmPe.matches ? COLUNAS_TELA_EM_PE : COLUNAS_TELA_DEITADA;
  const linhas = totalDeCartas / colunas;

  tabuleiro.style.setProperty("--colunas", colunas);
  tabuleiro.style.setProperty("--linhas", linhas);
}

// Troca os valores fixos do HTML pelos da dificuldade escolhida.
function mostrarConfiguracaoNoPlacar() {
  campoTempo.textContent = configuracao.tempo;
  camposErros.forEach((campo) => {
    campo.textContent = configuracao.erros;
  });
}

/* ---------- Montagem do tabuleiro ---------- */

// Fisher-Yates: devolve uma cópia embaralhada, sem mexer na original.
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Sorteia os personagens da partida, duplica cada um e embaralha os pares.
function sortearCartas() {
  const escolhidos = embaralhar(personagens).slice(0, configuracao.pares);
  return embaralhar([...escolhidos, ...escolhidos]);
}

// Todas as cartas começam escondidas (de costas) e com a imagem sorteada.
function montarTabuleiro() {
  const sorteadas = sortearCartas();

  cartasNoTabuleiro.slice(0, totalDeCartas).forEach((carta, indice) => {
    const personagem = sorteadas[indice];

    // O url() dentro de uma variável CSS é lido a partir da pasta css/, não da página.
    // Por isso o caminho vira um endereço completo antes de ir para --imagem.
    const endereco = new URL(personagem.image ?? personagem.imagem, document.baseURI).href;

    carta.classList.remove("carta--virada", "carta--removida");
    carta.dataset.par = personagem.id;
    carta.style.setProperty("--imagem", `url("${endereco}")`);

    new Image().src = endereco; // pré-carrega, para a carta não piscar ao virar
  });
}

/* ---------- Jogada ---------- */

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

function compararPar() {
  const acertou = primeiraCarta.dataset.par === segundaCarta.dataset.par;

  setTimeout(() => {
    if (acertou) {
      // PASSO 7: somar ponto e o bônus de tempo (configuracao.bonus) aqui
      primeiraCarta.classList.add("carta--removida");
      segundaCarta.classList.add("carta--removida");
    } else {
      // PASSO 7/8: descontar erro e trocar de jogador aqui
      primeiraCarta.classList.remove("carta--virada");
      segundaCarta.classList.remove("carta--virada");
    }

    primeiraCarta = null;
    segundaCarta = null;
    tabuleiro.classList.remove("tabuleiro--travado");
  }, acertou ? ATRASO_ACERTO : ATRASO_ERRO);
}

/* ---------- Início ---------- */
esconderCartasExtras();
ajustarGrade();
mostrarConfiguracaoNoPlacar();
montarTabuleiro();

tabuleiro.addEventListener("click", aoClicarNoTabuleiro);

// Se o aparelho girar, o CSS troca 8x4 por 4x8: a grade acompanha.
telaEmPe.addEventListener("change", ajustarGrade);
