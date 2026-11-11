const { createClient } = require('@libsql/client');

const client = createClient({ url: 'file:dev.db' });

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
  { nome: "Ninho com sonho de valsa e brigadeiro", preco: 0 }
];

const OPCOES_MASSA = [
  { opcao: "Massa Branca", preco: 70 },
  { opcao: "Massa de Chocolate", preco: 70 }
];

async function main() {
  console.log("Iniciando migração dos bolos doces...");

  // 1. Remover produtos antigos das categorias de bolos doces
  const deleteResult = await client.execute(
    "DELETE FROM produtos WHERE categoria IN ('Bolos - Massa Branca', 'Bolos - Massa Chocolate') OR id LIKE 'mb-%' OR id LIKE 'mc-%'"
  );
  console.log("Produtos de bolos antigos removidos:", deleteResult.rowsAffected);

  // 2. Inserir produto unificado 'Bolo Recheado' na categoria 'Bolos Doces'
  const id = "bolo-recheado";
  const nome = "Bolo Recheado";
  const descricao = "Escolha sua massa preferida (Branca ou Chocolate) e até 2 recheios especiais para montar o seu bolo perfeito.";
  const preco = 70.0;
  const categoria = "Bolos Doces";
  const status = "Ativo";
  const canalVisibilidade = "ambos";
  const imagem = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80";
  const tipoVariacao = "tamanho";
  const opcoesVariacao = JSON.stringify(OPCOES_MASSA);
  const adicionais = JSON.stringify(RECHEIOS_BOLOS);

  await client.execute({
    sql: `
      INSERT INTO produtos (id, nome, descricao, preco, categoria, status, canal_visibilidade, imagem, tipo_variacao, opcoes_variacao, adicionais)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nome = excluded.nome,
        descricao = excluded.descricao,
        preco = excluded.preco,
        categoria = excluded.categoria,
        status = excluded.status,
        canal_visibilidade = excluded.canal_visibilidade,
        imagem = excluded.imagem,
        tipo_variacao = excluded.tipo_variacao,
        opcoes_variacao = excluded.opcoes_variacao,
        adicionais = excluded.adicionais
    `,
    args: [
      id,
      nome,
      descricao,
      preco,
      categoria,
      status,
      canalVisibilidade,
      imagem,
      tipoVariacao,
      opcoesVariacao,
      adicionais
    ]
  });

  console.log("Produto unificado 'Bolo Recheado' cadastrado com sucesso!");

  // Conferir lista de categorias
  const cats = await client.execute("SELECT DISTINCT categoria, count(*) as count FROM produtos GROUP BY categoria");
  console.log("Categorias atuais no banco:", cats.rows);
}

main().catch(console.error);
