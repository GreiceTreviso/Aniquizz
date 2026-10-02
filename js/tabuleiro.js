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

/* ---------- Animação de embaralhamento ----------
   Todas as cartas (de costas) voam para o centro da mesa, balançam e
   se espalham de volta. Cada carta recebe --dx/--dy (distância até o
   centro) e --rot (giro); o movimento em si está no jogo.css.
   Quando termina, chama aoTerminar (a prévia das cartas). */
function embaralharComAnimacao(aoTerminar) {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzirMovimento) {
    aoTerminar();
    return;
  }

  emPrevia = true; // trava a pausa durante a animação
  tabuleiro.classList.add("tabuleiro--travado");

  const cartasDaPartida = cartasNoTabuleiro.slice(0, totalDeCartas);
  const areaDoTabuleiro = tabuleiro.getBoundingClientRect();
  const centroX = areaDoTabuleiro.left + areaDoTabuleiro.width / 2;
  const centroY = areaDoTabuleiro.top + areaDoTabuleiro.height / 2;

  cartasDaPartida.forEach((carta, indice) => {
    const area = carta.getBoundingClientRect();
    const dx = centroX - (area.left + area.width / 2);
    const dy = centroY - (area.top + area.height / 2);
    const giro = (Math.random() * 40 - 20).toFixed(1); // -20° a +20°

    carta.style.setProperty("--dx", `${dx}px`);
    carta.style.setProperty("--dy", `${dy}px`);
    carta.style.setProperty("--rot", `${giro}deg`);
    carta.style.animationDelay = `${indice * 8}ms`;
    carta.classList.add("carta--embaralhando");
  });

  setTimeout(() => {
    cartasDaPartida.forEach((carta) => {
      carta.classList.remove("carta--embaralhando");
      carta.style.animationDelay = "";
    });
    aoTerminar();
  }, TEMPO_EMBARALHAR);
}

/* ---------- Prévia (cartas viradas no início) ----------
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