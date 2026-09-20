/* ==========================================================
   opcoes.js — repassa as escolhas do jogador entre as telas

   Lê ?jogadores=1|2 e ?dificuldade=easy|normal|hard da URL e:
   1. grava os valores em <html data-jogadores data-dificuldade>,
      para o CSS (e o seu JS) saberem o modo de jogo;
   2. acrescenta essas escolhas aos links marcados com
      data-repassar-opcoes.

   Não tem nenhuma regra do jogo: isso continua com o seu JS.
   ========================================================== */

const VALORES_VALIDOS = {
  jogadores: ["1", "2"],
  dificuldade: ["easy", "normal", "hard"],
};

const parametros = new URLSearchParams(location.search);
const opcoes = {};

for (const [chave, permitidos] of Object.entries(VALORES_VALIDOS)) {
  const valor = parametros.get(chave);
  if (permitidos.includes(valor)) opcoes[chave] = valor;
}

opcoes.jogadores ??= "1"; // sem escolha na URL, assume 1 jogador

Object.assign(document.documentElement.dataset, opcoes);

document.querySelectorAll("a[data-repassar-opcoes]").forEach((link) => {
  const url = new URL(link.getAttribute("href"), location.href);

  for (const [chave, valor] of Object.entries(opcoes)) {
    if (!url.searchParams.has(chave)) url.searchParams.set(chave, valor);
  }

  link.href = url;
});
