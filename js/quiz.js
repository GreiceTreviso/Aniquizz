/* ==========================================================
   quiz.js — Quiz de verdadeiro ou falso (tela antes do jogo)
   Para adicionar perguntas, basta incluir um item em PERGUNTAS.
   ========================================================== */

const PERGUNTAS_POR_RODADA = 5; // quantas perguntas sorteadas a cada vez

const PERGUNTAS = [
  { texto: "Em Sailor Moon, as principais heroínas que lutam para proteger o mundo são todas meninas.", resposta: true,
    explicacao: "A obra popularizou as garotas mágicas guerreiras e mostrou protagonistas femininas fortes." },
  { texto: "Os filmes do Studio Ghibli quase nunca têm protagonistas femininas.", resposta: false,
    explicacao: "Miyazaki criou Chihiro, Kiki, Nausicaä e San, todas corajosas e independentes." },
  { texto: "Em Princesa Mononoke, Lady Eboshi lidera uma cidade e dá trabalho e abrigo a mulheres antes exploradas.", resposta: true,
    explicacao: "Ela é uma líder complexa e mostra mulheres em papéis de poder." },
  { texto: "Fullmetal Alchemist foi criado por uma mulher.", resposta: true,
    explicacao: "Hiromu Arakawa escreveu e desenhou o mangá, um shonen de enorme sucesso." },
  { texto: "Em Fullmetal Alchemist, a major-general Olivier Armstrong comanda a fortaleza do Norte.", resposta: true,
    explicacao: "Ela é um exemplo de liderança militar feminina na obra." },
  { texto: "Mikasa Ackerman, de Attack on Titan, é uma das soldadas mais habilidosas da história.", resposta: true,
    explicacao: "Ela desafia a ideia de que personagens femininas precisam ser frágeis." },
  { texto: "O grupo CLAMP, autor de Cardcaptor Sakura, é formado por um grupo de mulheres.", resposta: true,
    explicacao: "O coletivo ajudou a consolidar a presença feminina na criação de mangás." },
  { texto: "Em Frozen, a história gira em torno de um romance entre a princesa e o príncipe.", resposta: false,
    explicacao: "O centro da história é o amor entre as irmãs Elsa e Anna." },
  { texto: "O filme Barbie (2023) tornou Greta Gerwig a primeira mulher a dirigir sozinha um filme de mais de 1 bilhão de dólares.", resposta: true,
    explicacao: "O sucesso desmentiu a ideia de que filmes sobre o universo feminino não dão retorno." },
  { texto: "O teste de Bechdel avalia se uma obra tem duas mulheres com nome conversando sobre algo que não seja um homem.", resposta: true,
    explicacao: "Ele surgiu em uma tirinha de Alison Bechdel e é muito usado para discutir representação." },
  { texto: "As Dora Milaje, de Pantera Negra, formam a guarda de elite de Wakanda e são todas mulheres.", resposta: true,
    explicacao: "Elas aparecem como guerreiras habilidosas e leais." },
  { texto: "No primeiro Metroid (1986), o jogador descobre no final que Samus Aran é uma mulher.", resposta: true,
    explicacao: "A revelação surpreendeu a época e é um marco nos videogames." },
  { texto: "Heroínas só funcionam bem em obras voltadas ao público feminino.", resposta: false,
    explicacao: "Samus, Mikasa e Chihiro conquistaram fãs de todos os gêneros e idades." },
  { texto: "Cosplay não é consentimento: vestir uma fantasia não significa aceitar ser tocado ou assediado.", resposta: true,
    explicacao: "Eventos de cultura pop têm campanhas e regras contra o assédio." },
  { texto: "A diversidade de gênero entre criadores e roteiristas não influencia como personagens femininas são retratadas.", resposta: false,
    explicacao: "Com mais mulheres na criação, surgem personagens com mais profundidade e papéis variados." },
];

/* ---------- Elementos da tela ---------- */
const areaPergunta = document.getElementById("quiz-pergunta-area");
const areaResultado = document.getElementById("quiz-resultado-area");
const campoProgresso = document.getElementById("progresso");
const campoPergunta = document.getElementById("pergunta");
const campoFeedback = document.getElementById("feedback");
const campoResultado = document.getElementById("resultado");
const botoesResposta = [...document.querySelectorAll("[data-resposta]")];
const botaoProxima = document.getElementById("btn-proxima");

/* ---------- Estado ---------- */
const rodada = [...PERGUNTAS]
  .sort(() => Math.random() - 0.5)
  .slice(0, PERGUNTAS_POR_RODADA);

let indice = 0;
let acertos = 0;

/* ---------- Fluxo ---------- */
function mostrarPergunta() {
  const atual = rodada[indice];

  campoProgresso.textContent = `Question ${indice + 1} / ${rodada.length}`;
  campoPergunta.textContent = atual.texto;

  campoFeedback.hidden = true;
  campoFeedback.className = "quiz__feedback";
  botaoProxima.hidden = true;

  botoesResposta.forEach((botao) => {
    botao.disabled = false;
    botao.classList.remove("botao--certo");
  });
}

function responder(botao) {
  const atual = rodada[indice];
  const escolha = botao.dataset.resposta === "true";
  const acertou = escolha === atual.resposta;

  if (acertou) acertos++;

  botoesResposta.forEach((b) => (b.disabled = true));
  botao.classList.add("botao--certo");

  campoFeedback.textContent = `${acertou ? "Correct!" : "Not quite."} ${atual.explicacao}`;
  campoFeedback.classList.add(acertou ? "quiz__feedback--acerto" : "quiz__feedback--erro");
  campoFeedback.hidden = false;

  botaoProxima.textContent = indice === rodada.length - 1 ? "Finish" : "Next";
  botaoProxima.hidden = false;
  botaoProxima.focus();
}

function avancar() {
  indice++;
  if (indice < rodada.length) {
    mostrarPergunta();
  } else {
    mostrarResultado();
  }
}

function mostrarResultado() {
  areaPergunta.hidden = true;
  areaResultado.hidden = false;
  campoResultado.textContent = `You got ${acertos} of ${rodada.length}! Now let's play.`;
}

/* ---------- Início ---------- */
botoesResposta.forEach((botao) => botao.addEventListener("click", () => responder(botao)));
botaoProxima.addEventListener("click", avancar);

mostrarPergunta();
