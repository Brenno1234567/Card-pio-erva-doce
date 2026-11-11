import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Tabela de Produtos do Cardápio
export const produtos = sqliteTable("produtos", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  preco: real("preco").notNull(),
  categoria: text("categoria").notNull(),
  status: text("status").notNull().default("Ativo"),
  imagem: text("imagem"),
  // Canal de visibilidade: "ambos" (salão e público), "presencial" (só mesas), "publico" (só encomendas/delivery)
  canalVisibilidade: text("canal_visibilidade").notNull().default("ambos"),
  // Preço opcional diferenciado para delivery/público (se null, usa preco normal)
  precoDelivery: real("preco_delivery"),
  // null = simples (sem variação), "tamanho" = P/M/G/GG, "peso" = preço por Kg
  tipoVariacao: text("tipo_variacao"),
  // Para "tamanho": JSON array [{"opcao":"P","preco":15}, ...]
  // Para "peso": JSON config {"unidadePadrao":"g"|"kg","quantidadeMinima":1}
  // Quando tipoVariacao = "peso", preco armazena o valor por Kg
  opcoesVariacao: text("opcoes_variacao"),
  // Adicionais opcionais: JSON array [{"nome": "Nutella", "preco": 3.0}]
  adicionais: text("adicionais"),
});

// Tabela de Pedidos
export const pedidos = sqliteTable("pedidos", {
  id: text("id").primaryKey(),
  origem: text("origem").notNull().default("presencial"), // "presencial" | "encomenda" | "delivery" | "retirada"
  mesa: text("mesa"),
  cliente: text("cliente").notNull(),
  status: text("status").notNull().default("pendente"),
  observacao: text("observacao"),
  total: real("total").notNull(),
  criadoEm: integer("criado_em", { mode: "timestamp" }).notNull(),
  tokenCancelamento: text("token_cancelamento"),
  // Dados de Entrega / WhatsApp / Encomendas
  telefone: text("telefone"),
  tipoPedido: text("tipo_pedido"), // "entrega" | "retirada"
  endereco: text("endereco"),
  bairro: text("bairro"),
  complemento: text("complemento"),
  pontoReferencia: text("ponto_referencia"),
  formaPagamento: text("forma_pagamento"), // "pix" | "cartao_credito" | "cartao_debito" | "dinheiro"
  trocoPara: text("troco_para"),
  taxaEntrega: real("taxa_entrega").default(0),
  dataHoraEntrega: text("data_hora_entrega"),
});

// Tabela de Itens do Pedido
export const itensPedido = sqliteTable("itens_pedido", {
  id: text("id").primaryKey(),
  pedidoId: text("pedido_id").notNull(),
  produtoNome: text("produto_nome").notNull(),
  quantidade: integer("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
});

// Tabela de Configurações do Sistema
export const configuracoes = sqliteTable("configuracoes", {
  id: text("id").primaryKey(),
  nomeRestaurante: text("nome_restaurante").notNull(),
  statusLoja: integer("status_loja", { mode: "boolean" }).notNull(),
  tempoPreparo: text("tempo_preparo").notNull(),
  whatsapp: text("whatsapp"),
  // Número do WhatsApp para receber encomendas (formato: 5511999999999)
  whatsappEncomendas: text("whatsapp_encomendas"),
  chavePix: text("chave_pix"),
  tipoChavePix: text("tipo_chave_pix"),
  taxaEntrega: real("taxa_entrega").default(0),
});

// Tabela de Usuários / Colaboradores (Corrigida para SQLite e com os campos corretos)
export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull(),
  pin: text("pin").notNull(),
});

export const tentativasLogin = sqliteTable("tentativas_login", {
  identificador: text("identificador").primaryKey(),
  tentativas: integer("tentativas").notNull().default(0),
  bloqueadoAte: integer("bloqueado_ate"),
  atualizadoEm: integer("atualizado_em").notNull(),
});
