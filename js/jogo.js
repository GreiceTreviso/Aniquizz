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

const TEMPO_CRITICO = 5; // segundos: abaixo disso, o relógio do jogador fica vermelho

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

/* ---------- PASSO 3: Selecionar os elementos do DOM ----------
   TODO: implementar a seleção das cartas, tabuleiro, placares, erros,
   tempo e menu de pausa antes de continuar os próximos passos.
*/

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
// PASSO 10 (tempo individual): cada jogador tem o seu próprio "tempo",
// que só corre enquanto é a vez dele. Ganha bônus quando acerta um par
// e, se chegar a 0, esse jogador perde na hora.
let placar = [
  { pontos: 0, erros: configuracao.erros, tempo: configuracao.tempo },
  { pontos: 0, erros: configuracao.erros, tempo: configuracao.tempo },
];

// PASSO 10 (novo): no modo 2 jogadores, ficar sem tempo não é mais perder na
// hora — o jogador só fica "fora" (não joga mais). foraDoTempo[i] === true
// quer dizer que o jogador i não pode mais jogar porque o tempo dele acabou.
let foraDoTempo = [false, false];

let paresEncontrados = 0; // usado no Passo 12 para saber se venceu

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
  camposTempo.forEach((campo) => {
    campo.textContent = configuracao.tempo;
    campo.classList.remove("placar__tempo--critico");
  });
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
    camposTempo[indice].textContent = dados.tempo;
    camposTempo[indice].classList.toggle("placar__tempo--critico", dados.tempo <= TEMPO_CRITICO);
  });

  // Regra: o jogo acaba quando os erros de quem está jogando chegam a 0.
  // Se isso acontece depois que o outro jogador já tinha ficado sem tempo
  // (ele estava jogando sozinho "valendo"), quem vence é decidido pelos
  // pontos, e não pela tela genérica de "ficou sem erros".
  if (placar[jogadorAtual].erros <= 0) {
    if (numeroDeJogadores === 2 && foraDoTempo.some(Boolean)) {
      finalizarJogoPorPontos();
    } else {
      finalizarJogo("erros");
    }
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
      placar[jogadorAtual].tempo += configuracao.bonus; // bônus só no relógio de quem acertou
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

  const outroJogador = jogadorAtual === 0 ? 1 : 0;
  if (foraDoTempo[outroJogador]) return; // o outro já ficou sem tempo: continua com quem está jogando

  jogadorAtual = outroJogador;
  destacarJogadorDaVez();
}

// Adiciona uma classe no jogador da vez, para o CSS poder destacar.
function destacarJogadorDaVez() {
  const jogadores = document.querySelectorAll(".placar__jogador");

  jogadores.forEach((elemento, indice) => {
    elemento.classList.toggle("placar__jogador--vez", indice === jogadorAtual);
  });
}

/* ---------- PASSO 10: Cronômetro (um relógio por jogador) ----------
   Existe um único setInterval rodando, mas a cada segundo ele desconta
   do relógio de quem está jogando agora (placar[jogadorAtual].tempo).
   Como jogadorAtual muda ao trocar de vez, o relógio "certo" volta a
   correr sozinho, sem precisar parar/reiniciar o timer ao trocar. */
function iniciarCronometro() {
  idDoTimer = setInterval(() => {
    const jogadorDoTique = jogadorAtual;

    placar[jogadorDoTique].tempo--;
    camposTempo[jogadorDoTique].textContent = placar[jogadorDoTique].tempo;
    camposTempo[jogadorDoTique].classList.toggle(
      "placar__tempo--critico",
      placar[jogadorDoTique].tempo <= TEMPO_CRITICO
    );

    if (placar[jogadorDoTique].tempo <= 0) {
      aoZerarOTempo(jogadorDoTique);
    }
  }, 1000);
}

function pararCronometro() {
  clearInterval(idDoTimer);
  idDoTimer = null;
}

// Regra do relógio zerando:
// - 1 jogador: ele perde, fim de jogo na hora (como antes).
// - 2 jogadores: quem ficou sem tempo NÃO perde na hora. Ele só fica "fora"
//   (não joga mais) e a vez passa pro outro, que continua jogando sozinho
//   com o próprio relógio. O jogo só termina de vez quando os dois
//   ficarem sem tempo (ou o jogador que sobrou ficar sem erros, ou
//   completar o tabuleiro) — e aí o vencedor é decidido pelo placar de
//   pontos, não por quem "sobrou" por último.
function aoZerarOTempo(jogadorSemTempo) {
  if (numeroDeJogadores === 1) {
    finalizarJogo("tempo");
    return;
  }

  foraDoTempo[jogadorSemTempo] = true;
  const outroJogador = jogadorSemTempo === 0 ? 1 : 0;

  if (foraDoTempo[outroJogador]) {
    // Os dois já ficaram sem tempo: decide quem venceu pelos pontos.
    finalizarJogoPorPontos();
    return;
  }

  // O outro ainda tem tempo: a vez passa pra ele e o jogo continua.
  if (jogadorAtual !== outroJogador) {
    jogadorAtual = outroJogador;
    destacarJogadorDaVez();
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

function finalizarJogo(motivo, dados) {
  jogoTerminado = true;
  pararCronometro();
  tabuleiro.classList.add("tabuleiro--travado");

  if (motivo === "vitoria") {
    mostrarTelaDeVitoria();
  } else if (motivo === "pontos-vencedor") {
    mostrarTelaDeVitoriaPorPontos(dados.vencedor);
  } else if (motivo === "pontos-empate") {
    mostrarTelaDeEmpatePorPontos();
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

  // Recorde: soma do tempo que sobrou nos dois relógios (no 1 jogador é só o dele).
  const tempoFinal = placar[0].tempo + (numeroDeJogadores === 2 ? placar[1].tempo : 0);
  painelFimRecorde.hidden = !verificarRecorde(tempoFinal);
}

// PASSO 10 (novo): quando a partida termina porque os dois ficaram sem
// tempo (ou o jogador que sobrou ficou sem erros), o vencedor é sempre
// quem tiver mais pontos no placar — não importa quem ficou sem tempo
// primeiro nem quem estava jogando por último.
function finalizarJogoPorPontos() {
  const [placarJogador1, placarJogador2] = placar;

  if (placarJogador1.pontos === placarJogador2.pontos) {
    finalizarJogo("pontos-empate");
  } else {
    const vencedor = placarJogador1.pontos > placarJogador2.pontos ? 0 : 1;
    finalizarJogo("pontos-vencedor", { vencedor });
  }
}

function mostrarTelaDeVitoriaPorPontos(vencedor) {
  definirTemaDoPainel("vitoria");
  painelFimTitulo.textContent = "🏆 Vitória!";

  const perdedor = vencedor === 0 ? 1 : 0;
  painelFimResultado.textContent =
    `Fim de jogo! Jogador ${vencedor + 1} venceu no placar (${placar[vencedor].pontos} x ${placar[perdedor].pontos}).`;

  painelFimRecorde.hidden = true; // essa vitória é decidida pelo placar, não por completar o tabuleiro
}

function mostrarTelaDeEmpatePorPontos() {
  definirTemaDoPainel("vitoria");
  painelFimTitulo.textContent = "🤝 Empate!";
  painelFimResultado.textContent = `Fim de jogo! Empate: ${placar[0].pontos} pares cada.`;

  painelFimRecorde.hidden = true;
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
  foraDoTempo = [false, false];
  placar = [
    { pontos: 0, erros: configuracao.erros, tempo: configuracao.tempo },
    { pontos: 0, erros: configuracao.erros, tempo: configuracao.tempo },
  ];

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