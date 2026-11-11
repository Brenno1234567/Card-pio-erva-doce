const { createClient } = require('@libsql/client');

async function migrate() {
  const client = createClient({ url: 'file:dev.db' });
  const run = async (sql) => {
    try {
      await client.execute(sql);
      console.log('Executado com sucesso:', sql);
    } catch (e) {
      console.log('Já existe ou ignorado:', e.message);
    }
  };

  // Produtos
  await run("ALTER TABLE produtos ADD COLUMN canal_visibilidade TEXT NOT NULL DEFAULT 'ambos'");
  await run("ALTER TABLE produtos ADD COLUMN preco_delivery REAL");

  // Pedidos
  await run("ALTER TABLE pedidos ADD COLUMN origem TEXT NOT NULL DEFAULT 'presencial'");
  await run("ALTER TABLE pedidos ADD COLUMN telefone TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN tipo_pedido TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN endereco TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN bairro TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN complemento TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN ponto_referencia TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN forma_pagamento TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN troco_para TEXT");
  await run("ALTER TABLE pedidos ADD COLUMN taxa_entrega REAL DEFAULT 0");
  await run("ALTER TABLE pedidos ADD COLUMN data_hora_entrega TEXT");

  // Configuracoes
  await run("ALTER TABLE configuracoes ADD COLUMN whatsapp TEXT");
  await run("ALTER TABLE configuracoes ADD COLUMN chave_pix TEXT");
  await run("ALTER TABLE configuracoes ADD COLUMN tipo_chave_pix TEXT");
  await run("ALTER TABLE configuracoes ADD COLUMN taxa_entrega REAL DEFAULT 0");

  console.log('Migração das colunas no SQLite finalizada!');
}

migrate();
