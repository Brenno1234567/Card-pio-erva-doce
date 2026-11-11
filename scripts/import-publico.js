const { createClient } = require('@libsql/client');

async function importPublico() {
  const client = createClient({ url: 'file:dev.db' });

  // 1. Produtos do cardápio público/delivery para inserir com canal_visibilidade = 'publico' ou 'ambos'
  const produtosPublicos = [
    {
      id: 'combo-1',
      nome: 'Super Combo Rei Burguer',
      descricao: 'Hambúrguer artesanal especial, batata frita crocante e refrigerante gelado.',
      preco: 39.9,
      categoria: 'Combos',
      status: 'Ativo',
      imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      canalVisibilidade: 'publico',
    },
    {
      id: 'combo-2',
      nome: 'Combo Duplo Smash',
      descricao: '2x Smash burguers artesanais com queijo derretido e batata rústica.',
      preco: 34.9,
      categoria: 'Combos',
      status: 'Ativo',
      imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      canalVisibilidade: 'publico',
    },
    {
      id: 'porcao-1',
      nome: 'Batata Frita Especial',
      descricao: 'Porção generosa de batata frita com queijo cheddar cremoso e bacon crocante.',
      preco: 24.0,
      categoria: 'Porções',
      status: 'Ativo',
      imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      canalVisibilidade: 'ambos',
    },
    {
      id: 'bebida-1',
      nome: 'Refrigerante Lata 350ml',
      descricao: 'Coca-Cola, Guaraná Antarctica ou Fanta geladinha.',
      preco: 6.0,
      categoria: 'Bebidas',
      status: 'Ativo',
      imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      canalVisibilidade: 'ambos',
    },
  ];

  for (const p of produtosPublicos) {
    try {
      const check = await client.execute({ sql: 'SELECT id FROM produtos WHERE id = ?', args: [p.id] });
      if (check.rows.length === 0) {
        await client.execute({
          sql: 'INSERT INTO produtos (id, nome, descricao, preco, categoria, status, imagem, canal_visibilidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [p.id, p.nome, p.descricao, p.preco, p.categoria, p.status, p.imagem, p.canalVisibilidade],
        });
        console.log('Produto inserido:', p.nome);
      } else {
        console.log('Produto já existe:', p.nome);
      }
    } catch (e) {
      console.error('Erro ao importar produto', p.nome, e.message);
    }
  }

  // 2. Configurações vindas do Firestore (WhatsApp e Chave Pix configuradas)
  try {
    const configCheck = await client.execute('SELECT * FROM configuracoes LIMIT 1');
    if (configCheck.rows.length > 0) {
      await client.execute({
        sql: `UPDATE configuracoes SET 
          whatsapp = COALESCE(NULLIF(whatsapp, ''), '5514998156360'),
          whatsapp_encomendas = COALESCE(NULLIF(whatsapp_encomendas, ''), '5514998156360'),
          chave_pix = COALESCE(NULLIF(chave_pix, ''), '14998156360'),
          tipo_chave_pix = COALESCE(NULLIF(tipo_chave_pix, ''), 'Celular'),
          taxa_entrega = CASE WHEN taxa_entrega IS NULL OR taxa_entrega = 0 THEN 8.0 ELSE taxa_entrega END
        WHERE id = ?`,
        args: [configCheck.rows[0].id],
      });
      console.log('Configurações atualizadas com sucesso!');
    }
  } catch (e) {
    console.error('Erro ao atualizar configurações:', e.message);
  }

  console.log('Importação concluída!');
}

importPublico();
