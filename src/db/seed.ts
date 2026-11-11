import { db } from "./index";
import { produtos, configuracoes } from "./schema";

/** As colunas opcoesVariacao / adicionais são `text` no SQLite: grava como JSON em string. */
const json = (v: unknown) => JSON.stringify(v);

type Extra = {
  tipoVariacao?: string | null;
  opcoesVariacao?: unknown;
  adicionais?: unknown;
};

type Linha = [nome: string, preco: number, extra?: Extra];

function grupo(prefixo: string, categoria: string, linhas: Linha[], extraGrupo: Extra = {}) {
  return linhas.map(([nome, preco, extra], i) => {
    const e = { ...extraGrupo, ...extra };
    return {
      id: `${prefixo}-${String(i + 1).padStart(2, "0")}`,
      nome,
      descricao: "",
      preco,
      categoria,
      status: "Ativo",
      canalVisibilidade: "ambos",
      ...(e.tipoVariacao !== undefined && { tipoVariacao: e.tipoVariacao }),
      ...(e.opcoesVariacao !== undefined && { opcoesVariacao: json(e.opcoesVariacao) }),
      ...(e.adicionais !== undefined && { adicionais: json(e.adicionais) }),
    };
  });
}

const peso = (quantidadeMinima: number): Extra => ({
  tipoVariacao: "peso",
  opcoesVariacao: { unidadePadrao: "kg", quantidadeMinima },
});

const tamanho = (opcoes: [string, number][]): Extra => ({
  tipoVariacao: "tamanho",
  opcoesVariacao: opcoes.map(([opcao, preco]) => ({ opcao, preco })),
});

const ADIC_OMELETES = [
  { nome: "Bacon", preco: 4 },
  { nome: "Mussarela", preco: 3 },
  { nome: "Presunto", preco: 3 },
  { nome: "Ovo", preco: 2.8 },
  { nome: "Requeijão", preco: 3 },
  { nome: "Cheddar", preco: 4 },
  { nome: "Cream cheese", preco: 4 },
  { nome: "Queijo branco", preco: 4 },
  { nome: "Tomate", preco: 2 },
  { nome: "Alface", preco: 2 },
  { nome: "Salada (tomate e alface)", preco: 4 },
  { nome: "Batata palha", preco: 3 },
];

const ADIC_GELADAS = [
  { nome: "Caramelo salgado", preco: 3 },
  { nome: "Leite moça", preco: 3 },
  { nome: "Alpino", preco: 3 },
  { nome: "Nutella", preco: 3 },
  { nome: "Ovomaltine", preco: 3 },
];

const ADIC_QUENTES = [
  { nome: "Canela", preco: 2 },
  { nome: "Chantilly", preco: 2 },
  { nome: "Gotas de chocolate", preco: 2 },
  { nome: "Calda de caramelo", preco: 2 },
  { nome: "Leite condensado", preco: 2 },
];

const RECHEIOS_BOLOS = [
  { nome: "Alpino", preco: 0 },
  { nome: "Alpino e mousse de Chocolate Picado", preco: 0 },
  { nome: "Brigadeiro e Leite Ninho", preco: 0 },
  { nome: "Brigadeiro e Mousse de Maracujá", preco: 0 },
  { nome: "Brigadeiro e Prestígio", preco: 0 },
  { nome: "Brigadeiro, Leite Ninho com Cerejas", preco: 0 },
  { nome: "Brigadeiro, Lua de Mel com Morangos", preco: 0 },
  { nome: "Brigadeiro, Mousse de Chocolate trufado com chocolate picado", preco: 0 },
  { nome: "Capuccino e Brigadeiro", preco: 0 },
  { nome: "Chocolate Alpino e Leite Ninho", preco: 0 },
  { nome: "Chocolate Kit Kat", preco: 0 },
  { nome: "Chocolate trufado preto e trufado branco", preco: 0 },
  { nome: "Creme com ameixas e Doce de Leite cozido", preco: 0 },
  { nome: "Creme com Amendoim e Leite Condensado cozido", preco: 0 },
  { nome: "Creme com morangos e Nozes", preco: 0 },
  { nome: "Creme com pêssegos e Leite condensado cozido", preco: 0 },
  { nome: "Creme de Abacaxi e Doce de Leite cozido", preco: 0 },
  { nome: "Creme de Abacaxi e Leite Ninho", preco: 0 },
  { nome: "Creme de Abacaxi e recheio de coco", preco: 0 },
  { nome: "Doce de Leite cozido", preco: 0 },
  { nome: "Doce de Leite cozido com ameixas, prestígio e cobertura de Marshmallow", preco: 0 },
  { nome: "Lua de Mel com Morangos e Leite Ninho", preco: 0 },
  { nome: "Lua de mel e Ninho com cerejas", preco: 0 },
  { nome: "Ninho com doce de leite cozido", preco: 0 },
  { nome: "Ninho com ouro branco e lua de mel", preco: 0 },
  { nome: "Ninho com sonho de valsa e brigadeiro", preco: 0 },
];

const listaProdutos = [
  // 1. Salgados
  ...grupo("salg", "Salgados", [
    ["Coxinha", 7.5],
    ["Kibe", 7.5],
    ["Risoles (Presunto e Queijo)", 7.5],
    ["Croquete de carne", 7.5],
    ["Bolinho de carne", 8.5],
    ["Empada (Frango e Palmito)", 7.5],
    ["Enrolado de Presunto e Queijo", 7.5],
    ["Pastelão de Palmito com Catupiry", 7.5],
    ["Enrolado de Salsicha com Presunto e Queijo", 7.5],
    ["Calabresa com Catupiry", 7.5],
    ["Frango com Catupiry", 7.5],
    ["Torta de Frango", 12.0],
    ["Torta de Calabresa", 12.0],
    ["Esfirra de Carne", 7.5],
    ["Hambúrguer com Presunto e Queijo", 10.0],
    ["Hambúrguer com Presunto, Queijo e bacon", 10.0],
    ["Hambúrguer com Presunto, Queijo, bacon e cheddar", 10.0],
  ]),

  // 2. Lanches Quentes
  ...grupo("lq", "Lanches Quentes", [
    ["Misto Quente", 14.0],
    ["Bauru", 16.0],
    ["Americano de Presunto", 20.0],
    ["Queijo Quente", 14.0],
    ["Cheese Salada Burger", 22.0],
    ["Cheese Vegetariano", 20.0],
    ["Cheese Egg Burger", 28.0],
    ["Cheese Bacon Burger", 28.0],
    ["Cheese Calabresa Burger", 25.0],
    ["Cheese Tudo Burger", 30.0],
    ["Cheese Caipira", 25.0],
  ]),

  // 3. Lanches Frios
  ...grupo("lf", "Lanches Frios", [
    ["Lanche Natural de Presunto", 12.0],
    ["Lanche Natural de Peito de Peru", 14.0],
    ["Lanche Natural de Salame", 15.0],
    ["Lanche Natural de Frango", 14.0],
  ]),

  // 4. Cervejas
  ...grupo("cerv", "Cervejas", [
    ["Heineken 330ML", 0.0],
    ["Amstel 350ML", 0.0],
  ]),

  // 5. Empadão (por Kg)
  ...grupo(
    "emp",
    "Empadão (por Kg)",
    [
      ["Calabresa com Muçarela", 45.0],
      ["Frango com Muçarela", 45.0],
      ["Frango com Palmito e Muçarela", 45.0],
      ["Palmito", 45.0],
    ],
    peso(100),
  ),

  // 6. Sucos
  ...grupo("suc", "Sucos", [
    ["Laranja (Fruta)", 14.0],
    ["Laranja e acerola (Fruta/polpa)", 16.0],
    ["Laranja e morango (Fruta)", 18.0],
    ["Abacaxi com água (Fruta)", 14.0],
    ["Abacaxi com Hortelã (Fruta)", 14.5],
    ["Morango com... (Fruta)", 16.0],
    ["Morango com leite (Fruta)", 18.0],
    ["Maracujá com polpa", 14.0],
    ["Maracujá com polpa e leite", 16.0],
    ["Opção com polpa", 14.0],
    ["Opção com polpa", 14.0],
    ["Limão (polpa)", 14.0],
    ["Limonada Italiana", 12.0],
  ]),

  // 7. Bolo Salgado
  ...grupo("bs", "Bolo Salgado", [
    ["Frango com Muçarela", 45.0],
    ["Frango com palmito e Muçarela", 45.0],
    ["Atum c/ muçarela", 70.0],
  ]),

  // 8. Baguetes
  ...grupo("bag", "Baguetes", [
    ["Baguete de Presunto e Queijo", 65.0],
    ["Baguete de Peito de Peru", 65.0],
    ["Baguete de Salame", 65.0],
    ["Baguete de Frango", 65.0],
    ["Baguete de Tomate Seco", 65.0],
  ]),

  // 9. Pães
  ...grupo("pao", "Pães", [
    ["Pão Francês com manteiga", 4.5],
    ["Pão Francês com manteiga na chapa", 5.5],
    ["Pão Francês com margarina", 4.0],
    ["Pão Francês com margarina na chapa", 5.0],
    ["Pão Francês com requeijão na chapa", 8.0],
    ["Pão Casquinha", 12.0],
    ["Pão Francês - Kg", 15.0, peso(50)],
    ["Baguete - Kg", 22.0, peso(100)],
    ["Pão Doril - Kg", 22.0, peso(100)],
  ]),

  // 10. Pães de Queijo
  ...grupo("pq", "Pães de Queijo", [
    ["Presunto e muçarela", 12.0],
    ["Peito de peru com muçarela ou queijo branco", 14.0],
    ["Frango com muçarela", 14.0],
    ["Frango com requeijão", 14.0],
    ["Frango com bacon e muçarela", 15.0],
    ["Muçarela com requeijão", 12.0],
    ["Casquinha", 13.0],
  ]),

  // 11. Bebidas Geladas
  ...grupo(
    "bg",
    "Bebidas Geladas",
    [
      ["Chocolate gelado copo", 15.0, tamanho([["P", 15], ["G", 18]])],
      ["Cappuccino gelado", 15.0, tamanho([["P", 15], ["G", 18]])],
      ["Café Affogato", 14.0],
      ["Milk Shake de Chocolate", 18.0],
      ["Milk Shake de Morango", 18.0],
      ["Milk Shake de Rafaelo", 20.0],
      ["Milk Shake de Ovomaltine", 20.0],
    ],
    { adicionais: ADIC_GELADAS },
  ),

  // 12. Bebidas Quentes
  ...grupo(
    "bq",
    "Bebidas Quentes",
    [
      ["Café coado (com açúcar)", 2.0, tamanho([["P", 2], ["M", 4]])],
      ["Café com leite", 2.5, tamanho([["P", 2.5], ["M", 5]])],
      ["Café expresso com leite", 5.5, tamanho([["P", 5.5], ["M", 7]])],
      ["Café expresso (sem açúcar)", 4.5],
      ["Chocolate quente xícara", 10.0],
      ["Cappuccino (da casa)", 10.0],
    ],
    { adicionais: ADIC_QUENTES },
  ),

  // 13. Salgadinhos (Cento)
  ...grupo("cent", "Salgadinhos (Cento)", [
    ["Coxinha", 95.0],
    ["Risólis", 95.0],
    ["Bolinha de Queijo", 95.0],
    ["Esfirrinha de Carne", 95.0],
    ["Esfirrinha de Frango", 95.0],
    ["Esfirrinha de Calabresa", 95.0],
    ["Salsichinha", 95.0],
    ["Enroladinho de Presunto e Queijo", 95.0],
    ["Empadinhas de Frango", 105.0],
    ["Empadinhas de Palmito", 105.0],
    ["Empadinhas de Calabresa com Requeijão", 105.0],
    ["Mini Cachorro Quente", 105.0],
    ["Mini Quiches", 105.0],
    ["Quiches", 105.0],
    ["Kibe", 95.0],
    ["Pão de Batata com Patê", 159.0],
  ]),

  // 14. Tortas Doces (por Kg)
  ...grupo(
    "td",
    "Tortas Doces (por Kg)",
    [
      ["Sabor Limão", 80.0],
      ["Sabor Morango", 80.0],
      ["Pudim Leite Condensado", 45.0],
    ],
    peso(100),
  ),

  // 15. Docinhos
  ...grupo("doc", "Docinhos", [
    ["Brigadeiro", 110.0],
    ["Bicho de Pé", 110.0],
    ["Beijinho", 110.0],
    ["Casadinho", 110.0],
    ["Churros", 110.0],
    ["Bombom de Morango", 110.0],
    ["Mini Bombons", 80.0, peso(100)],
  ]),

  // 16. Bolos Doces
  {
    id: "bolo-recheado",
    nome: "Bolo Recheado",
    descricao: "Escolha sua massa preferida (Branca ou Chocolate) e até 2 recheios especiais para montar o seu bolo perfeito.",
    preco: 70.0,
    categoria: "Bolos Doces",
    status: "Ativo",
    canalVisibilidade: "ambos",
    tipoVariacao: "tamanho",
    opcoesVariacao: json([
      { opcao: "Massa Branca", preco: 70 },
      { opcao: "Massa de Chocolate", preco: 70 },
    ]),
    adicionais: json(RECHEIOS_BOLOS),
  },

  // 18. Omeletes
  ...grupo(
    "om",
    "Omeletes",
    [
      ["Omelete de presunto, queijo e tomate", 18.0],
      ["Omelete de queijo branco", 18.0],
      ["Omelete com mussarela e requeijão", 18.0],
      ["Omelete com peito de peru e mussarela ou queijo branco", 20.0],
      ["Omelete de frango com mussarela ou requeijão", 20.0],
      ["Omelete simples com 3 ovos", 12.0],
      ["Omelete simples com 2 ovos", 10.0],
    ],
    { adicionais: ADIC_OMELETES },
  ),
];

async function seed() {
  console.log("Populando o banco de dados...");

  await db
    .insert(configuracoes)
    .values({
      id: "config-principal",
      nomeRestaurante: "",
      statusLoja: true,
      tempoPreparo: "30-45",
    })
    .onConflictDoNothing();

  // Insere em lotes para não estourar o limite de parâmetros do driver
  const TAMANHO_LOTE = 50;
  for (let i = 0; i < listaProdutos.length; i += TAMANHO_LOTE) {
    const lote = listaProdutos.slice(i, i + TAMANHO_LOTE);
    await db.insert(produtos).values(lote).onConflictDoNothing();
  }

  console.log(`Banco de dados populado com sucesso! (${listaProdutos.length} produtos)`);
}

seed().catch((err) => {
  console.error("Erro ao popular o banco:", err);
  process.exit(1);
});
