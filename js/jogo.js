/* ==========================================================
   jogo.js — regras do Jogo da Memória de Animes

   Passo 2: ler as opções e configurar a dificuldade.

   Depende de js/opcoes.js (carregado antes), que grava
   data-jogadores e data-dificuldade no <html>.
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
  
  /* ---------- Opções da partida ---------- */
  const raiz = document.documentElement;
  
  const nomeDificuldade = Object.hasOwn(DIFICULDADES, raiz.dataset.dificuldade)
    ? raiz.dataset.dificuldade
    : DIFICULDADE_PADRAO;
  
  raiz.dataset.dificuldade = nomeDificuldade;
  
  const numeroDeJogadores = Number(raiz.dataset.jogadores); // 1 ou 2 (opcoes.js assume 1)
  const configuracao = DIFICULDADES[nomeDificuldade];
  const totalDeCartas = configuracao.pares * 2;
  
  /* ---------- Elementos da tela ---------- */
  const tabuleiro = document.getElementById("tabuleiro");
  const cartas = [...tabuleiro.querySelectorAll(".carta")];
  const campoTempo = document.getElementById("tempo");
  const camposErros = [
    document.getElementById("erros-jogador-1"),
    document.getElementById("erros-jogador-2"),
  ];
  
  const telaEmPe = window.matchMedia("(orientation: portrait)");
  
  /* ---------- Funções ---------- */
  
  // Cartas além do necessário saem da tela (display: none via atributo hidden).
  function esconderCartasExtras() {
    cartas.forEach((carta, indice) => {
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
  
  /* ---------- Início ---------- */
  esconderCartasExtras();
  ajustarGrade();
  mostrarConfiguracaoNoPlacar();
  
  // Se o aparelho girar, o CSS troca 8x4 por 4x8: a grade acompanha.
  telaEmPe.addEventListener("change", ajustarGrade);
  