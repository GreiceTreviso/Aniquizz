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
  html[data-jogadores="2"] .placar__jogador--vez { outline: 3px solid #000; outline-offset: 3px; border-radius: 8px; }
`;
document.head.append(estiloDoAviso);

// A faixa fica ENTRE o topo e a mesa (e não dentro da mesa), senão ela
// toma espaço do tabuleiro e as cartas passam do fim da tela no celular.
tabuleiro.closest(".mesa").before(avisoDeVez);

// Adiciona uma classe no jogador da vez, para o CSS poder destacar,
// e atualiza a faixa de aviso.
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