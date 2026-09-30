/* ==========================================================
   jogo.js — regras do Jogo da Memória de Animes

   Passo 2: ler as opções e configurar a dificuldade.
   Passo 4: variáveis de estado da partida.
   Passo 5: sortear os personagens do json.js e montar o tabuleiro.
   Passo 6: virar as cartas ao clicar.
   Passo 7: comparar o par (pontos, bônus de tempo e erros).
   Passo 8: turnos no modo 2 jogadores.
   Passo 9: atualizar placar e erros na tela.
   Passo 10: cronômetro (um relógio por jogador).
   Passo 11: pausa (popover nativo).
   Passo 12: telas de vitória/derrota/placar final (popover nativo).
   Passo 13: iniciarJogo(), chamada ao carregar a página.
   Passo 14: extras (sons, recorde no localStorage, animação no acerto).
   NOVO: prévia — todas as cartas aparecem viradas no início.

   Depende de (nesta ordem): opcoes.js, json.js, jogo.js.
   - opcoes.js grava data-jogadores e data-dificuldade no <html>.
   - json.js cria a lista "cartas" com os personagens.
   ========================================================== */

/* ---------- Configuração por dificuldade ----------
   pares: quantos pares de cartas entram na partida
   tempo: segundos no relógio de CADA jogador ao começar
          tempo[1] = modo 1 jogador, tempo[2] = modo 2 jogadores
   bonus: segundos ganhos a cada par encontrado (ponha 0 para desligar)
   erros: erros permitidos por jogador

   Nº de cartas = pares x 2. Os valores 16, 24 e 32 dividem certinho
   por 8 e por 4 colunas (tela deitada e em pé), sem sobrar espaço. */
   const DIFICULDADES = {
    easy:   { pares: 8,  tempo: { 1: 120, 2: 40 }, bonus: 5, erros: 25 },
    normal: { pares: 12, tempo: { 1: 90,  2: 35 }, bonus: 4, erros: 20 },
    hard:   { pares: 16, tempo: { 1: 45,  2: 30 }, bonus: 3, erros: 15 },
  };
  
  const DIFICULDADE_PADRAO = "normal"; // se abrir jogo.html sem passar pela escolha
  const COLUNAS_TELA_DEITADA = 8;
  const COLUNAS_TELA_EM_PE = 4;
  
  const ATRASO_ACERTO = 600; // ms que o par certo fica à vista antes de sumir
  const ATRASO_ERRO = 900;   // ms que o par errado fica à vista antes de desvirar
  
  // NOVO: por quanto tempo (ms) as cartas ficam viradas no início para o
  // jogador memorizar. O relógio só começa a correr depois disso.
  const TEMPO_PREVIA = 3000;
  
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
  
  const numeroDeJogadores = raiz.dataset.jogadores === "2" ? 2 : 1; // qualquer outra coisa = 1
  const configuracao = DIFICULDADES[nomeDificuldade];
  const totalDeCartas = configuracao.pares * 2;
  const tempoInicial = configuracao.tempo[numeroDeJogadores]; // segundos de cada jogador
  
  /* ---------- Dados e elementos da tela ----------
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
    console.warn("jogo.js: erros-jogador-1 e erros-jogador-2 apontam para o MESMO elemento. Confira os ids no HTML.");
  }
  
  /* ---------- NOVO: Sinalizador de vez (só no modo 2 jogadores) ----------
     Cria uma faixa "Vez do Jogador N" acima do tabuleiro (muda de cor e dá
     uma pulada a cada troca) e deixa o placar de quem espera mais apagado,
     e o de quem joga com contorno amarelo. Tudo feito aqui, sem mexer no CSS. */
  const avisoDeVez = document.createElement("div");
  avisoDeVez.id = "aviso-de-vez";
  avisoDeVez.setAttribute("aria-live", "polite");
  avisoDeVez.hidden = numeroDeJogadores === 1;
  
  const estiloDoAviso = document.createElement("style");
  estiloDoAviso.textContent = `
    #aviso-de-vez { text-align: center; font-weight: 700; font-size: 1.2rem; color: #fff;
      padding: .4rem 1.2rem; margin: .5rem auto; width: fit-content; border-radius: 999px; }
    #aviso-de-vez[hidden] { display: none; }
    #aviso-de-vez.aviso--jogador-1 { background: #1e88e5; }
    #aviso-de-vez.aviso--jogador-2 { background: #e53935; }
    #aviso-de-vez.aviso--pisca { animation: aviso-pisca .5s ease; }
    @keyframes aviso-pisca { 0% { transform: scale(1); } 40% { transform: scale(1.25); } 100% { transform: scale(1); } }
    html[data-jogadores="2"] .placar__jogador { transition: opacity .2s; }
    html[data-jogadores="2"] .placar__jogador:not(.placar__jogador--vez) { opacity: .45; }
    html[data-jogadores="2"] .placar__jogador--vez { outline: 3px solid #ffd54a; outline-offset: 3px; border-radius: 8px; }
  `;
  document.head.append(estiloDoAviso);
  tabuleiro.before(avisoDeVez);
  
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
  
  let emPrevia = false; // true enquanto as cartas estão viradas no início
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
    campoTempo.textContent = tempoInicial;
    camposErros.forEach((campo) => {
      if (campo) campo.textContent = configuracao.erros;
    });
  }
  
  // O campo de tempo mostra o relógio de quem está jogando agora.
  function mostrarTempoDaVez() {
    campoTempo.textContent = Math.max(tempos[jogadorAtual], 0);
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
  
  // Monta as cartas com a imagem sorteada (a prévia é que as deixa viradas).
  function montarTabuleiro() {
    const sorteadas = sortearCartas();
  
    cartasNoTabuleiro.slice(0, totalDeCartas).forEach((carta, indice) => {
      const personagem = sorteadas[indice];
  
      // O url() dentro de uma variável CSS é lido a partir da pasta css/, não da página.
      // Por isso o caminho vira um endereço completo antes de ir para --imagem.
      const endereco = new URL(personagem.image ?? personagem.imagem, document.baseURI).href;
  
      carta.classList.remove("carta--virada", "carta--removida", "carta--acertou");
      carta.dataset.par = personagem.id;
      carta.style.setProperty("--imagem", `url("${endereco}")`);
  
      new Image().src = endereco; // pré-carrega, para a carta não piscar ao virar
    });
  }
  
  /* ---------- NOVO: Prévia (cartas viradas no início) ----------
     Vira todas as cartas, trava o tabuleiro por TEMPO_PREVIA ms,
     desvira tudo e só então liga o cronômetro. */
  function mostrarPreviaDasCartas() {
    emPrevia = true;
    tabuleiro.classList.add("tabuleiro--travado");
  
    const cartasDaPartida = cartasNoTabuleiro.slice(0, totalDeCartas);
    cartasDaPartida.forEach((carta) => carta.classList.add("carta--virada"));
  
    setTimeout(() => {
      emPrevia = false;
      cartasDaPartida.forEach((carta) => carta.classList.remove("carta--virada"));
  
      // Se o jogador abriu o menu de pausa durante a prévia, espera ele fechar
      // (o evento "toggle" chama continuar() e liga o relógio).
      if (menuPausa && menuPausa.matches(":popover-open")) {
        jogoPausado = true;
        return;
      }
  
      tabuleiro.classList.remove("tabuleiro--travado");
      iniciarCronometro();
    }, TEMPO_PREVIA);
  }
  
  /* ---------- PASSO 9: Placar e erros ---------- */
  
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
  
  // Adiciona uma classe no jogador da vez, para o CSS poder destacar.
  function destacarJogadorDaVez() {
    const jogadores = document.querySelectorAll(".placar__jogador");
  
    jogadores.forEach((elemento, indice) => {
      elemento.classList.toggle("placar__jogador--vez", indice === jogadorAtual);
    });
  
    if (numeroDeJogadores === 2) {
      avisoDeVez.textContent = `▶ Vez do Jogador ${jogadorAtual + 1}`;
      avisoDeVez.classList.remove("aviso--jogador-1", "aviso--jogador-2", "aviso--pisca");
      avisoDeVez.classList.add(`aviso--jogador-${jogadorAtual + 1}`);
      void avisoDeVez.offsetWidth; // força o navegador a reiniciar a animação
      avisoDeVez.classList.add("aviso--pisca");
    }
  }
  
  /* ---------- PASSO 10: Cronômetro (um relógio por jogador) ----------
     Existe um único setInterval, mas a cada segundo ele desconta do
     relógio de quem está jogando agora. Ao trocar de vez, o relógio
     "certo" passa a correr sozinho, sem parar/reiniciar o timer. */
  
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
  
  /* ---------- PASSO 12: Telas de vitória, derrota e placar final ---------- */
  
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
      painelFimTitulo.textContent = "🤝 Empate!";
    } else {
      const vencedor = jogador1.pontos > jogador2.pontos ? 1 : 2;
      painelFimTitulo.textContent = `🏆 Jogador ${vencedor} venceu!`;
    }
  
    painelFimResultado.textContent =
      `Jogador 1: ${jogador1.pontos} pares | Jogador 2: ${jogador2.pontos} pares`;
  
    painelFimRecorde.hidden = true; // recorde só vale no modo 1 jogador
  }
  
  function mostrarTelaDeVitoria() {
    definirTemaDoPainel("vitoria");
    painelFimTitulo.textContent = "🏆 Vitória!";
    painelFimResultado.textContent = `Você encontrou todos os ${placar[0].pontos} pares!`;
  
    painelFimRecorde.hidden = !verificarRecorde(tempos[0]);
  }
  
  function mostrarTelaDeDerrota(motivo) {
    definirTemaDoPainel("derrota");
    painelFimTitulo.textContent = "💀 Você perdeu";
  
    painelFimResultado.textContent = motivo === "tempo"
      ? "O tempo acabou. Fim de jogo."
      : "Você ficou sem erros. Fim de jogo.";
  
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
     Zera o estado, monta o tabuleiro, mostra a prévia das cartas e, quando
     ela acaba, liga o cronômetro (quem liga é mostrarPreviaDasCartas). */
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
    mostrarPreviaDasCartas(); // o cronômetro começa depois da prévia
  }
  
  /* ---------- Início ---------- */
  iniciarJogo();
  
  tabuleiro.addEventListener("click", aoClicarNoTabuleiro);
  
  // Se o aparelho girar, o CSS troca 8x4 por 4x8: a grade acompanha.
  telaEmPe.addEventListener("change", ajustarGrade);