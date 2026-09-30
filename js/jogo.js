/* ==========================================================
   jogo.js — regras do Jogo da Memória de Animes

   Passo 2: ler as opções e configurar a dificuldade.
   Passo 4: variáveis de estado da partida.
   Passo 5: sortear os personagens do json.js e montar o tabuleiro.
   Passo 6: virar as cartas ao clicar.
   Passo 7: comparar o par (pontos, bônus de tempo e erros).
   Passo 8: turnos no modo 2 jogadores.
   Passo 9: atualizar placar e erros na tela.
   Passo 10: cronômetro.
   Passo 11: pausa (popover nativo).
   Passo 12: telas de vitória/derrota (popover nativo).
   Passo 13: iniciarJogo(), chamada ao carregar a página.
   Passo 14: extras (sons, recorde no localStorage, animação no acerto).

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
  easy:   { pares: 8,  tempo: 40, bonus: 5, erros: 25 },
  normal: { pares: 12, tempo: 25, bonus: 4, erros: 20 },
  hard:   { pares: 16, tempo: 20, bonus: 3, erros: 15 },
};

const DIFICULDADE_PADRAO = "normal"; // se abrir jogo.html sem passar pela escolha
const COLUNAS_TELA_DEITADA = 8;
const COLUNAS_TELA_EM_PE = 4;

const ATRASO_ACERTO = 600; // ms que o par certo fica à vista antes de sumir
const ATRASO_ERRO = 900;   // ms que o par errado fica à vista antes de desvirar

// PASSO 14: sons de acerto e erro. Coloque os arquivos em assets/audio/
// (se o arquivo não existir, tocarSom() só ignora o erro, sem travar o jogo).
const SOM_ACERTO = new Audio("assets/audio/acerto.mp3");
const SOM_ERRO = new Audio("assets/audio/erro.mp3");

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

/* ---------- Estado da jogada ---------- */
let primeiraCarta = null;
let segundaCarta = null;

/* ---------- PASSO 4: Estado geral da partida ----------
   jogadorAtual: 0 = jogador 1, 1 = jogador 2 (bate com os índices
   dos arrays camposPontos/camposErros acima).
   No modo 1 jogador, jogadorAtual fica sempre 0. */
let jogadorAtual = 0;

// Um objeto de placar por jogador, em vez de variáveis soltas:
// facilita repetir a lógica no Passo 8/9 sem duplicar código.
let placar = [
  { pontos: 0, erros: configuracao.erros },
  { pontos: 0, erros: configuracao.erros },
];

let paresEncontrados = 0; // usado no Passo 12 para saber se venceu

let tempoRestante = configuracao.tempo;
let idDoTimer = null; // vai guardar o retorno do setInterval (Passo 10)

let jogoPausado = false;
let jogoTerminado = false;

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

/* ---------- PASSO 9: Placar e erros ---------- */

// Escreve pontos/erros de cada jogador nos elementos do HTML.
// Chamada sempre que alguém acerta ou erra um par.
function atualizarPlacar() {
  placar.forEach((dados, indice) => {
    camposPontos[indice].textContent = dados.pontos;
    camposErros[indice].textContent = dados.erros;
  });

  // Regra: o jogo acaba quando os erros de quem está jogando chegam a 0.
  if (placar[jogadorAtual].erros <= 0) {
    finalizarJogo("erros");
  }
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
      primeiraCarta.classList.add("carta--removida", "carta--acertou");
      segundaCarta.classList.add("carta--removida", "carta--acertou");
      tocarSom(SOM_ACERTO);

      paresEncontrados++;
      placar[jogadorAtual].pontos++;
      tempoRestante += configuracao.bonus; // bônus por acertar
    } else {
      primeiraCarta.classList.remove("carta--virada");
      segundaCarta.classList.remove("carta--virada");
      tocarSom(SOM_ERRO);

      placar[jogadorAtual].erros--;
    }

    primeiraCarta = null;
    segundaCarta = null;
    tabuleiro.classList.remove("tabuleiro--travado");

    atualizarPlacar();

    if (jogoTerminado) return; // atualizarPlacar() já pode ter encerrado o jogo

    // PASSO 8: no modo 2 jogadores, só troca a vez quando erra.
    // Quem acerta continua jogando.
    if (!acertou) {
      trocarDeJogador();
    }

    if (paresEncontrados === configuracao.pares) {
      finalizarJogo("vitoria");
    }
  }, acertou ? ATRASO_ACERTO : ATRASO_ERRO);
}

/* ---------- PASSO 8: Turnos (modo 2 jogadores) ---------- */

// No modo 1 jogador (numeroDeJogadores === 1) isso nunca é chamado
// de verdade, porque só existe o índice 0 no placar.
function trocarDeJogador() {
  if (numeroDeJogadores < 2) return;

  jogadorAtual = jogadorAtual === 0 ? 1 : 0;
  destacarJogadorDaVez();
}

// Adiciona uma classe no jogador da vez, para o CSS poder destacar.
function destacarJogadorDaVez() {
  const jogadores = document.querySelectorAll(".placar__jogador");

  jogadores.forEach((elemento, indice) => {
    elemento.classList.toggle("placar__jogador--vez", indice === jogadorAtual);
  });
}

/* ---------- PASSO 10: Cronômetro ---------- */

function iniciarCronometro() {
  idDoTimer = setInterval(() => {
    tempoRestante--;
    campoTempo.textContent = tempoRestante;

    if (tempoRestante <= 0) {
      aoZerarOTempo();
    }
  }, 1000);
}

function pararCronometro() {
  clearInterval(idDoTimer);
  idDoTimer = null;
}

// Regra: tempo esgotado é fim de jogo na hora (derrota), não desconta erro
// nem passa a vez — o jogo simplesmente acaba.
function aoZerarOTempo() {
  finalizarJogo("tempo");
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
  iniciarCronometro();
  tabuleiro.classList.remove("tabuleiro--travado");
}

if (menuPausa) {
  menuPausa.addEventListener("toggle", (evento) => {
    if (jogoTerminado) return;
    evento.newState === "open" ? pausar() : continuar();
  });
}

/* ---------- PASSO 12: Telas de vitória e derrota ---------- */

function finalizarJogo(motivo) {
  jogoTerminado = true;
  pararCronometro();
  tabuleiro.classList.add("tabuleiro--travado");

  motivo === "vitoria" ? mostrarTelaDeVitoria() : mostrarTelaDeDerrota(motivo);
  painelFim.showPopover();
}

// Troca o tema do painel (cor do título) entre vitória e derrota.
function definirTemaDoPainel(tema) {
  painelFim.classList.remove("painel-fim--vitoria", "painel-fim--derrota");
  painelFim.classList.add(`painel-fim--${tema}`);
}

function mostrarTelaDeVitoria() {
  definirTemaDoPainel("vitoria");
  painelFimTitulo.textContent = "🏆 Vitória!";

  if (numeroDeJogadores === 2) {
    const [placarJogador1, placarJogador2] = placar;

    if (placarJogador1.pontos === placarJogador2.pontos) {
      painelFimResultado.textContent = `Empate! ${placarJogador1.pontos} pares cada.`;
    } else {
      const vencedor = placarJogador1.pontos > placarJogador2.pontos ? 1 : 2;
      const maior = Math.max(placarJogador1.pontos, placarJogador2.pontos);
      const menor = Math.min(placarJogador1.pontos, placarJogador2.pontos);
      painelFimResultado.textContent = `Jogador ${vencedor} venceu! (${maior} x ${menor})`;
    }
  } else {
    painelFimResultado.textContent = `Você encontrou todos os ${placar[0].pontos} pares!`;
  }

  painelFimRecorde.hidden = !verificarRecorde(tempoRestante);
}

function mostrarTelaDeDerrota(motivo) {
  definirTemaDoPainel("derrota");
  painelFimTitulo.textContent = "💀 Você perdeu";

  if (motivo === "tempo") {
    painelFimResultado.textContent = "O tempo acabou. Fim de jogo.";
  } else {
    painelFimResultado.textContent = numeroDeJogadores === 2
      ? `Jogador ${jogadorAtual + 1} ficou sem erros. Fim de jogo.`
      : "Você ficou sem erros. Fim de jogo.";
  }

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

/* ---------- PASSO 13: Iniciar o jogo ----------
   Zera o estado, monta o tabuleiro, atualiza o placar e liga o cronômetro.
   É a única função chamada "na mão" lá no fim do arquivo. */
function iniciarJogo() {
  jogoTerminado = false;
  jogoPausado = false;
  primeiraCarta = null;
  segundaCarta = null;
  jogadorAtual = 0;
  paresEncontrados = 0;
  placar = [
    { pontos: 0, erros: configuracao.erros },
    { pontos: 0, erros: configuracao.erros },
  ];
  tempoRestante = configuracao.tempo;

  esconderCartasExtras();
  ajustarGrade();
  mostrarConfiguracaoNoPlacar();
  montarTabuleiro();
  destacarJogadorDaVez();
  atualizarPlacar();

  pararCronometro();
  iniciarCronometro();
}

/* ---------- Início ---------- */
iniciarJogo();

tabuleiro.addEventListener("click", aoClicarNoTabuleiro);

// Se o aparelho girar, o CSS troca 8x4 por 4x8: a grade acompanha.
telaEmPe.addEventListener("change", ajustarGrade);
