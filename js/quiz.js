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
  /* ----- Perguntas gerais sobre igualdade de gênero ----- */
  { texto: "Igualdade de gênero significa que homens e mulheres devem ter os mesmos direitos, deveres e oportunidades.", resposta: true,
    explicacao: "O objetivo é que o gênero de uma pessoa não limite o que ela pode estudar, conquistar ou ser." },
  { texto: "No Brasil, as mulheres conquistaram o direito de votar em 1932.", resposta: true,
    explicacao: "O voto feminino foi garantido pelo Código Eleitoral de 1932, depois de décadas de luta." },
  { texto: "A Lei Maria da Penha, de 2006, existe para combater a violência doméstica e familiar contra a mulher.", resposta: true,
    explicacao: "Ela leva o nome de uma mulher que sofreu violência do marido e lutou por justiça por quase 20 anos." },
  { texto: "A Constituição brasileira de 1988 afirma que homens e mulheres são iguais em direitos e obrigações.", resposta: true,
    explicacao: "A igualdade entre homens e mulheres está no artigo 5º, que trata dos direitos fundamentais." },
  { texto: "A igualdade de gênero é um assunto que interessa apenas às mulheres.", resposta: false,
    explicacao: "Ela beneficia toda a sociedade, inclusive os homens, que também sofrem com estereótipos e cobranças." },
  { texto: "Meninos e meninas nascem naturalmente incapazes de seguir certas profissões por causa do gênero.", resposta: false,
    explicacao: "Profissões e interesses são moldados por educação, cultura e oportunidades, não pelo gênero." },
  { texto: "Duas pessoas que fazem o mesmo trabalho, com a mesma qualificação, devem receber o mesmo salário, seja qual for o gênero.", resposta: true,
    explicacao: "No Brasil, a Lei 14.611, de 2023, reforçou a igualdade salarial entre mulheres e homens." },
  { texto: "Dividir as tarefas da casa e o cuidado com os filhos é uma forma de promover a igualdade de gênero.", resposta: true,
    explicacao: "Quando o trabalho doméstico é compartilhado, as mulheres ganham mais tempo para estudar, trabalhar e descansar." },
  { texto: "O Dia Internacional da Mulher é comemorado em 8 de março.", resposta: true,
    explicacao: "A data lembra a luta das mulheres por direitos como trabalho digno, voto e igualdade." },
  { texto: "A ONU inclui a igualdade de gênero entre os Objetivos de Desenvolvimento Sustentável, o ODS 5.", resposta: true,
    explicacao: "O ODS 5 busca alcançar a igualdade de gênero e empoderar todas as mulheres e meninas." },
  { texto: "Marie Curie foi a primeira pessoa a ganhar dois prêmios Nobel.", resposta: true,
    explicacao: "Ela venceu em Física (1903) e em Química (1911), numa época em que poucas mulheres entravam na ciência." },
  { texto: "Dizer que “homem não chora” é um estereótipo de gênero que também prejudica os homens.", resposta: true,
    explicacao: "Esse tipo de frase ensina meninos a esconder sentimentos e pode atrapalhar a saúde emocional deles." },
  { texto: "Dilma Rousseff foi a primeira mulher eleita presidente do Brasil.", resposta: true,
    explicacao: "Ela foi eleita em 2010 e tomou posse em 2011." },
  { texto: "Importunação sexual, ou seja, ato libidinoso sem consentimento, é crime no Brasil desde 2018.", resposta: true,
    explicacao: "A Lei 13.718, de 2018, passou a punir esse tipo de comportamento." },
  { texto: "O Ligue 180 é o canal de atendimento para orientar e receber denúncias de violência contra a mulher.", resposta: true,
    explicacao: "A central funciona em todo o Brasil e ajuda a encaminhar as mulheres para a rede de proteção." },
  { texto: "Violência contra a mulher é um problema privado do casal, e ninguém de fora deve se envolver.", resposta: false,
    explicacao: "É um problema de toda a sociedade, e denunciar pode salvar vidas." },
  { texto: "Em média, no mundo todo, as mulheres ainda recebem salários menores que os homens.", resposta: true,
    explicacao: "Essa diferença, chamada de desigualdade salarial de gênero, persiste na maioria dos países." },
  { texto: "Piadas que ridicularizam as mulheres são inofensivas e não contribuem para o preconceito.", resposta: false,
    explicacao: "Piadas assim reforçam estereótipos e ajudam a normalizar a desigualdade e a violência." },
  { texto: "Ver mulheres em cargos de liderança pode inspirar meninas a sonharem mais alto.", resposta: true,
    explicacao: "A representatividade mostra que todos os espaços podem ser ocupados por mulheres." },
  { texto: "No Brasil, uma lei de 1827 já tratava de escolas para meninas, mas o ensino delas era bem diferente do dos meninos.", resposta: true,
    explicacao: "A educação feminina avançou muito desde então, mas por muito tempo as oportunidades foram desiguais." },
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

  campoProgresso.textContent = `Pergunta ${indice + 1} / ${rodada.length}`;
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

  campoFeedback.textContent = `${acertou ? "Correto!" : "Quase lá."} ${atual.explicacao}`;
  campoFeedback.classList.add(acertou ? "quiz__feedback--acerto" : "quiz__feedback--erro");
  campoFeedback.hidden = false;

  botaoProxima.textContent = indice === rodada.length - 1 ? "Finalizar" : "Próxima";
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
  campoResultado.textContent = `Você acertou ${acertos} de ${rodada.length}! Agora vamos jogar.`;
}

/* ---------- Início ---------- */
botoesResposta.forEach((botao) => botao.addEventListener("click", () => responder(botao)));
botaoProxima.addEventListener("click", avancar);

mostrarPergunta();
