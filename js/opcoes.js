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
