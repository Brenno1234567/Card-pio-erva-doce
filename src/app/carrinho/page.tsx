"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Minus,
  Plus,
  ArrowLeft,
  ShoppingCart,
  Bike,
  Store,
  QrCode,
  CreditCard,
  Banknote,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { useCartStore } from "../../contexts/cartStore";

interface Configuracoes {
  nomeRestaurante?: string;
  statusLoja?: boolean;
  tempoPreparo?: string;
  whatsapp?: string;
  whatsappEncomendas?: string;
  chavePix?: string;
  tipoChavePix?: string;
  taxaEntrega?: number;
}

function ConteudoCarrinho() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itens, alterarQuantidade, removerItem, limparCarrinho } = useCartStore();
  const mesaSalva = useCartStore((state) => state.mesa);
  const mesaQr = searchParams.get("mesa") ?? mesaSalva;
  const mesaValida = Boolean(mesaQr && /^Mesa\s+\d+$/i.test(mesaQr));

  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [chaveCopiada, setChaveCopiada] = useState(false);

  // Campos específicos do Presencial
  const [retirarNoBalcao, setRetirarNoBalcao] = useState(false);

  // Campos específicos do Público / Delivery / Encomendas
  const [tipoPedido, setTipoPedido] = useState<"entrega" | "retirada">("entrega");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [pontoReferencia, setPontoReferencia] = useState("");
  const [dataHoraEntrega, setDataHoraEntrega] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "cartao_credito" | "cartao_debito" | "dinheiro">("pix");
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Erro ao carregar configurações:", err));
  }, []);

  const subtotal = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const taxaEntregaValor = !mesaValida && tipoPedido === "entrega" ? Number(config?.taxaEntrega ?? 0) : 0;
  const total = subtotal + taxaEntregaValor;

  const numeroMesa = mesaQr?.match(/^Mesa\s+(\d+)$/i)?.[1];
  const cardapioHref = mesaValida
    ? `/cardapio/mesa-${numeroMesa}?ativo=1`
    : "/cardapio";
  const localPedido = retirarNoBalcao ? "Balcão" : mesaQr!;
  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const copiarChavePix = () => {
    if (!config?.chavePix) return;
    navigator.clipboard.writeText(config.chavePix);
    setChaveCopiada(true);
    setTimeout(() => setChaveCopiada(false), 2500);
  };

  const montarMensagemWhatsApp = (pedidoIdCurto: string) => {
    const nomeLoja = config?.nomeRestaurante || "Erva Doce AscanI";
    const linhas: string[] = [];

    linhas.push(`*NOVO PEDIDO - ${nomeLoja.toUpperCase()}*`);
    linhas.push(`*Código do Pedido:* #${pedidoIdCurto}`);
    linhas.push(`----------------------------------`);
    linhas.push(`*Cliente:* ${cliente.trim()}`);
    if (telefone.trim()) linhas.push(`*WhatsApp:* ${telefone.trim()}`);
    linhas.push(`*Modalidade:* ${tipoPedido === "entrega" ? "Entrega (Delivery)" : "Retirada no Balcão"}`);

    if (tipoPedido === "entrega") {
      linhas.push(`*Endereço:* ${endereco.trim()}`);
      if (bairro.trim()) linhas.push(`*Bairro:* ${bairro.trim()}`);
      if (complemento.trim()) linhas.push(`*Complemento:* ${complemento.trim()}`);
      if (pontoReferencia.trim()) linhas.push(`*Ponto de Ref.:* ${pontoReferencia.trim()}`);
    }

    if (dataHoraEntrega.trim()) {
      linhas.push(`*Data / Horário:* ${dataHoraEntrega.trim()}`);
    }

    linhas.push(`----------------------------------`);
    linhas.push(`*ITENS DO PEDIDO:*`);
    itens.forEach((i) => {
      let nomeCompleto = i.nome;
      if (i.variacao) nomeCompleto += ` (${i.variacao})`;
      if (i.adicionais && i.adicionais.length > 0) {
        nomeCompleto += ` [+ ${i.adicionais.join(", ")}]`;
      }
      const itemTotal = precoFormatado(i.preco * i.quantidade);
      linhas.push(`• *${i.quantidade}x* ${nomeCompleto} — ${itemTotal}`);
    });

    linhas.push(`----------------------------------`);
    if (taxaEntregaValor > 0) {
      linhas.push(`*Subtotal:* ${precoFormatado(subtotal)}`);
      linhas.push(`*Taxa de Entrega:* ${precoFormatado(taxaEntregaValor)}`);
    }
    linhas.push(`*TOTAL:* *${precoFormatado(total)}*`);

    const textoPagamento: Record<string, string> = {
      pix: "Pix",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      dinheiro: precisaTroco && trocoPara ? `Dinheiro (Troco para R$ ${trocoPara})` : "Dinheiro (Sem troco)",
    };
    linhas.push(`*Forma de Pagamento:* ${textoPagamento[formaPagamento] || formaPagamento}`);

    if (formaPagamento === "pix" && config?.chavePix) {
      linhas.push(`*Chave Pix:* ${config.chavePix} (${config.tipoChavePix || "Chave"})`);
    }

    if (observacao.trim()) {
      linhas.push(`*Observação:* ${observacao.trim()}`);
    }

    linhas.push(`----------------------------------`);
    linhas.push(`_Aguardando confirmação do restaurante!_`);

    return encodeURIComponent(linhas.join("\n"));
  };

  async function finalizarPedido() {
    if (itens.length === 0) return alert("Seu carrinho está vazio!");
    if (!cliente.trim()) return alert("Por favor, digite o seu nome.");

    // Validações públicas
    if (!mesaValida) {
      if (!telefone.trim()) return alert("Por favor, informe seu número de WhatsApp com DDD.");
      if (tipoPedido === "entrega" && !endereco.trim()) {
        return alert("Por favor, informe seu endereço de entrega (rua e número).");
      }
    }

    setEnviando(true);
    try {
      const payloadItens = itens.map((i) => {
        let nomeFormatado = i.nome;
        if (i.variacao) nomeFormatado += ` (${i.variacao})`;
        if (i.adicionais && i.adicionais.length > 0) {
          nomeFormatado += ` [+ ${i.adicionais.join(", ")}]`;
        }
        return {
          id: i.id,
          nome: nomeFormatado,
          quantidade: i.quantidade,
          preco: i.preco,
          variacao: i.variacao,
        };
      });

      const bodyData = mesaValida
        ? {
            origem: "presencial",
            mesa: localPedido,
            cliente,
            observacao,
            itens: payloadItens,
          }
        : {
            origem: "encomenda",
            cliente,
            telefone,
            tipoPedido,
            endereco,
            bairro,
            complemento,
            pontoReferencia,
            dataHoraEntrega,
            formaPagamento,
            trocoPara: precisaTroco ? trocoPara : null,
            taxaEntrega: taxaEntregaValor,
            observacao,
            itens: payloadItens,
          };

      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(data?.error || "Erro ao enviar pedido.");

      const pedidosSalvos = JSON.parse(localStorage.getItem("meusPedidos") || "[]");
      pedidosSalvos.push({ id: data.pedidoId, token: data.tokenCancelamento });
      localStorage.setItem("meusPedidos", JSON.stringify(pedidosSalvos));

      if (mesaValida) {
        alert("Pedido enviado com sucesso para a cozinha!");
        limparCarrinho();
        router.push("/orders");
      } else {
        // Modo Encomenda / WhatsApp: abre o WhatsApp com a mensagem pronta
        const pedidoIdCurto = String(data.pedidoId || "").substring(0, 6).toUpperCase();
        const msgEnc = montarMensagemWhatsApp(pedidoIdCurto);
        const numeroWhats =
          config?.whatsappEncomendas ||
          config?.whatsapp ||
          "5514998156360";

        const urlWhatsapp = `https://api.whatsapp.com/send?phone=${numeroWhats.replace(/\D/g, "")}&text=${msgEnc}`;
        limparCarrinho();
        window.open(urlWhatsapp, "_blank");
        router.push("/orders");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo p-4 pb-36 max-w-2xl mx-auto w-full min-w-0">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 min-w-0">
        <button
          onClick={() => router.push(cardapioHref)}
          className="bg-white p-2.5 rounded-xl border border-cinza-borda shadow-sm hover:border-dourado/60 transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={20} className="text-verde-escuro" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-verde-escuro truncate">Seu Carrinho</h1>
          <span className="text-xs text-cinza-texto font-medium">
            {mesaValida ? `Atendimento na ${mesaQr}` : "Pedido Online & Encomendas"}
          </span>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={48} className="mx-auto text-cinza-texto mb-3 opacity-40" />
          <p className="text-cinza-texto font-medium">Seu carrinho está vazio.</p>
          <button
            onClick={() => router.push(cardapioHref)}
            className="mt-4 bg-verde-normal text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-verde-destaque transition-colors cursor-pointer"
          >
            Ver Cardápio
          </button>
        </div>
      ) : (
        <>
          {/* Lista de Itens */}
          <div className="space-y-3 mb-6">
            {itens.map((item) => {
              const itemKey = `${item.id}::${item.variacao || ""}::${item.unidadePeso || ""}::${(item.adicionais || []).join(",")}`;
              return (
                <div
                  key={itemKey}
                  className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-verde-escuro truncate">{item.nome}</h3>
                    {item.variacao && (
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.tipoVariacao === "peso"
                            ? "bg-dourado-claro/60 text-dourado-escuro border-dourado/30"
                            : "bg-verde-claro/50 text-verde-escuro border-verde-normal/20"
                        }`}
                      >
                        {item.tipoVariacao === "tamanho" ? "Tam." : item.tipoVariacao === "peso" ? "Peso" : ""}: {item.variacao}
                      </span>
                    )}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.adicionais.map((adic) => (
                          <span
                            key={adic}
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-verde-claro/40 text-verde-escuro border border-verde-normal/20"
                          >
                            +{adic}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-cinza-texto mt-1">
                      {item.tipoVariacao === "peso"
                        ? `${item.quantidade}x ${item.variacao} • ${precoFormatado(item.preco)} cada`
                        : `Qtd: ${item.quantidade}x • ${precoFormatado(item.preco)}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-bold text-verde-normal">{precoFormatado(item.preco * item.quantidade)}</span>
                    {item.tipoVariacao === "peso" ? (
                      <button
                        onClick={() => removerItem(item.id, item.variacao, item.unidadePeso, item.adicionais)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Minus size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center border border-cinza-borda rounded-lg overflow-hidden">
                        <button
                          onClick={() => alterarQuantidade(item.id, item.quantidade - 1, item.variacao, item.unidadePeso, item.adicionais)}
                          className="p-2 text-verde-escuro hover:bg-verde-claro/40 transition-colors"
                          aria-label="Diminuir"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold text-verde-escuro">{item.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(item.id, item.quantidade + 1, item.variacao, item.unidadePeso, item.adicionais)}
                          className="p-2 text-verde-escuro hover:bg-verde-claro/40 transition-colors"
                          aria-label="Aumentar"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FORMULÁRIO PRESENCIAL (MESA) */}
          {mesaValida ? (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cinza-borda/50 shadow-sm space-y-4 mb-6">
              <h3 className="font-bold text-verde-escuro text-sm">Informações do Pedido no Salão</h3>
              <div>
                <label className="block text-xs text-cinza-texto mb-1 font-medium">Seu Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal/15 focus:border-verde-normal transition-all"
                />
              </div>
              <fieldset>
                <legend className="block text-xs text-cinza-texto mb-2 font-medium">Como quer receber?</legend>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 bg-fundo p-3 rounded-xl border border-cinza-borda text-sm cursor-pointer hover:border-verde-normal/40 transition-colors">
                    <input type="radio" name="recebimento" checked={!retirarNoBalcao} onChange={() => setRetirarNoBalcao(false)} />
                    Entregar na {mesaQr}
                  </label>
                  <label className="flex items-center gap-3 bg-fundo p-3 rounded-xl border border-cinza-borda text-sm cursor-pointer hover:border-verde-normal/40 transition-colors">
                    <input type="radio" name="recebimento" checked={retirarNoBalcao} onChange={() => setRetirarNoBalcao(true)} />
                    Retirar no balcão
                  </label>
                </div>
              </fieldset>
              <div>
                <label className="block text-xs text-cinza-texto mb-1 font-medium">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Sem açúcar, aquecer bem"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:ring-2 focus:ring-verde-normal/15 focus:border-verde-normal transition-all"
                />
              </div>
            </div>
          ) : (
            /* FORMULÁRIO PÚBLICO (ENCOMENDAS & WHATSAPP) */
            <div className="space-y-4 mb-6">
              {/* Modalidade */}
              <div className="bg-white p-4 rounded-2xl border border-cinza-borda/50 shadow-sm">
                <label className="block text-xs text-cinza-texto mb-2 font-semibold">Como deseja receber?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoPedido("entrega")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      tipoPedido === "entrega"
                        ? "bg-verde-escuro text-white border-verde-escuro shadow"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/40"
                    }`}
                  >
                    <Bike size={18} /> Entrega (Delivery)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPedido("retirada")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      tipoPedido === "retirada"
                        ? "bg-verde-escuro text-white border-verde-escuro shadow"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/40"
                    }`}
                  >
                    <Store size={18} /> Retirar no Balcão
                  </button>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cinza-borda/50 shadow-sm space-y-3">
                <h3 className="font-bold text-verde-escuro text-sm">Seus Dados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-cinza-texto mb-1 font-medium">Seu Nome *</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Oliveira"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cinza-texto mb-1 font-medium">WhatsApp / Telefone *</label>
                    <input
                      type="tel"
                      placeholder="Ex: (14) 99888-7777"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                    />
                  </div>
                </div>

                {/* Campos de Entrega */}
                {tipoPedido === "entrega" && (
                  <div className="space-y-3 pt-2 border-t border-cinza-borda/40">
                    <div>
                      <label className="block text-xs text-cinza-texto mb-1 font-medium">Endereço (Rua e Número) *</label>
                      <input
                        type="text"
                        placeholder="Ex: Rua das Flores, 123"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-cinza-texto mb-1 font-medium">Bairro</label>
                        <input
                          type="text"
                          placeholder="Ex: Centro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-cinza-texto mb-1 font-medium">Complemento</label>
                        <input
                          type="text"
                          placeholder="Ex: Apto 12, Bloco B"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-cinza-texto mb-1 font-medium">Ponto de Referência</label>
                      <input
                        type="text"
                        placeholder="Ex: Próximo ao supermercado"
                        value={pontoReferencia}
                        onChange={(e) => setPontoReferencia(e.target.value)}
                        className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-cinza-texto mb-1 font-medium">Data / Horário de Preferência (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Hoje às 17h ou Amanhã pela manhã"
                    value={dataHoraEntrega}
                    onChange={(e) => setDataHoraEntrega(e.target.value)}
                    className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cinza-borda/50 shadow-sm space-y-3">
                <h3 className="font-bold text-verde-escuro text-sm">Forma de Pagamento</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormaPagamento("pix")}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formaPagamento === "pix"
                        ? "bg-verde-normal text-white border-verde-normal shadow-sm"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/30"
                    }`}
                  >
                    <QrCode size={16} /> Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormaPagamento("cartao_credito")}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formaPagamento === "cartao_credito"
                        ? "bg-verde-normal text-white border-verde-normal shadow-sm"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/30"
                    }`}
                  >
                    <CreditCard size={16} /> Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormaPagamento("cartao_debito")}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formaPagamento === "cartao_debito"
                        ? "bg-verde-normal text-white border-verde-normal shadow-sm"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/30"
                    }`}
                  >
                    <CreditCard size={16} /> Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormaPagamento("dinheiro")}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formaPagamento === "dinheiro"
                        ? "bg-verde-normal text-white border-verde-normal shadow-sm"
                        : "bg-fundo text-verde-escuro border-cinza-borda hover:border-verde-normal/30"
                    }`}
                  >
                    <Banknote size={16} /> Dinheiro
                  </button>
                </div>

                {/* Bloco Pix */}
                {formaPagamento === "pix" && config?.chavePix && (
                  <div className="bg-verde-claro/30 border border-verde-normal/30 p-3.5 rounded-xl space-y-2 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-verde-escuro">Chave Pix ({config.tipoChavePix || "Chave"}):</span>
                      <button
                        type="button"
                        onClick={copiarChavePix}
                        className="flex items-center gap-1 text-[11px] font-bold text-verde-normal hover:text-verde-destaque cursor-pointer bg-white px-2 py-1 rounded-md border border-verde-normal/30"
                      >
                        {chaveCopiada ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        {chaveCopiada ? "Copiada!" : "Copiar Chave"}
                      </button>
                    </div>
                    <code className="block bg-white p-2 rounded-lg text-xs font-mono text-verde-escuro break-all border border-verde-normal/20">
                      {config.chavePix}
                    </code>
                  </div>
                )}

                {/* Bloco Dinheiro c/ Troco */}
                {formaPagamento === "dinheiro" && (
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-verde-escuro cursor-pointer">
                      <input
                        type="checkbox"
                        checked={precisaTroco}
                        onChange={(e) => setPrecisaTroco(e.target.checked)}
                        className="rounded text-verde-normal focus:ring-verde-normal"
                      />
                      Precisa de troco?
                    </label>
                    {precisaTroco && (
                      <div>
                        <label className="block text-xs text-cinza-texto mb-1">Troco para quanto?</label>
                        <input
                          type="text"
                          placeholder="Ex: 50,00 ou 100,00"
                          value={trocoPara}
                          onChange={(e) => setTrocoPara(e.target.value)}
                          className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                <div className="pt-2">
                  <label className="block text-xs text-cinza-texto mb-1 font-medium">Observações (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Enviar talheres descartáveis, tocar campainha"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full bg-fundo p-3 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Barra Fixa Inferior */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-cinza-borda p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg z-20">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-1 text-xs text-cinza-texto">
                <span>Subtotal:</span>
                <span className="font-bold text-verde-escuro">{precoFormatado(subtotal)}</span>
              </div>
              {!mesaValida && tipoPedido === "entrega" && (
                <div className="flex justify-between items-center mb-2 text-xs text-cinza-texto">
                  <span>Taxa de Entrega:</span>
                  <span className="font-bold text-verde-escuro">{precoFormatado(taxaEntregaValor)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-3 pt-1 border-t border-cinza-borda/40">
                <span className="text-cinza-texto text-sm font-bold">Total:</span>
                <span className="text-xl font-extrabold text-verde-escuro">{precoFormatado(total)}</span>
              </div>
              <button
                onClick={finalizarPedido}
                disabled={enviando}
                className="w-full bg-verde-normal text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-verde-destaque transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {enviando ? (
                  "Processando..."
                ) : mesaValida ? (
                  "Finalizar Pedido da Mesa →"
                ) : (
                  <>
                    <MessageCircle size={20} />
                    Finalizar e Enviar no WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TelaCarrinho() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-fundo flex items-center justify-center text-verde-escuro font-bold">
          Carregando carrinho...
        </main>
      }
    >
      <ConteudoCarrinho />
    </Suspense>
  );
}
