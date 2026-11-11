"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, ShoppingCart, Weight } from "lucide-react";
import {
  useCartStore,
  parseOpcoesVariacao,
  parseConfigPeso,
  parseAdicionais,
  calcularPrecoPorPeso,
  type TipoVariacao,
} from "../contexts/cartStore";

export interface ProdutoDetalhe {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  categoria?: string;
  tipoVariacao?: TipoVariacao;
  opcoesVariacao?: string | null;
  adicionais?: string | null;
}

interface ModalProdutoProps {
  produto: ProdutoDetalhe;
  onClose: () => void;
}

const IMAGEM_PADRAO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

const precoFormatado = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ModalProduto({ produto, onClose }: ModalProdutoProps) {
  const adicionarItem = useCartStore((state) => state.adicionarItem);

  const opcoes = useMemo(
    () => parseOpcoesVariacao(produto.opcoesVariacao),
    [produto.opcoesVariacao]
  );

  const configPeso = useMemo(
    () => parseConfigPeso(produto.tipoVariacao === "peso" ? produto.opcoesVariacao : null),
    [produto.tipoVariacao, produto.opcoesVariacao]
  );

  const listaAdicionais = useMemo(
    () => parseAdicionais(produto.adicionais),
    [produto.adicionais]
  );

  const temVariacaoTamanho = produto.tipoVariacao === "tamanho" && opcoes.length > 0;
  const temVariacaoPeso = produto.tipoVariacao === "peso";

  // Identifica se é bolo e se variação representa tipo de massa
  const ehOpcaoMassa = opcoes.some((o) => o.opcao.toLowerCase().includes("massa"));
  const ehBolo =
    ehOpcaoMassa ||
    Boolean(produto.categoria?.toLowerCase().includes("bolo")) ||
    produto.nome.toLowerCase().includes("bolo");

  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState(1);
  const [erroVariacao, setErroVariacao] = useState(false);
  const [erroRecheio, setErroRecheio] = useState(false);
  const [avisoLimite, setAvisoLimite] = useState(false);
  const [buscaRecheio, setBuscaRecheio] = useState("");

  // Estado para produtos por peso
  const [quantidadePeso, setQuantidadePeso] = useState<string>("");
  const [unidadePeso, setUnidadePeso] = useState<"g" | "kg">("g");

  // Reset quando o produto muda
  useEffect(() => {
    setOpcaoSelecionada(null);
    setAdicionaisSelecionados([]);
    setQuantidade(1);
    setErroVariacao(false);
    setErroRecheio(false);
    setAvisoLimite(false);
    setBuscaRecheio("");
    setQuantidadePeso("");
    setUnidadePeso(configPeso.unidadePadrao);
  }, [produto.id, configPeso.unidadePadrao]);

  // Bloqueia scroll do body enquanto aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Preço ativo para produtos por tamanho
  const precoAtivoTamanho = temVariacaoTamanho && opcaoSelecionada
    ? opcoes.find((o) => o.opcao === opcaoSelecionada)?.preco ?? produto.preco
    : produto.preco;

  // Quantidade numérica para produtos por peso
  const quantidadePesoNum = parseFloat(quantidadePeso.replace(",", ".")) || 0;

  // Preço calculado para produtos por peso
  const precoAtivoPeso = temVariacaoPeso && quantidadePesoNum > 0
    ? calcularPrecoPorPeso(produto.preco, quantidadePesoNum, unidadePeso)
    : 0;

  // Total dos adicionais selecionados
  const precoAdicionaisTotal = useMemo(() => {
    return adicionaisSelecionados.reduce((total, nomeAdic) => {
      const adic = listaAdicionais.find((a) => a.nome === nomeAdic);
      return total + (adic ? adic.preco : 0);
    }, 0);
  }, [adicionaisSelecionados, listaAdicionais]);

  const toggleAdicional = (nome: string) => {
    setErroRecheio(false);
    setAdicionaisSelecionados((prev) => {
      if (prev.includes(nome)) {
        return prev.filter((n) => n !== nome);
      }
      if (ehBolo && prev.length >= 2) {
        setAvisoLimite(true);
        setTimeout(() => setAvisoLimite(false), 2800);
        return prev;
      }
      return [...prev, nome];
    });
  };

  // Preço unitário considerando adicionais
  const precoUnitarioFinal =
    (temVariacaoPeso ? precoAtivoPeso : precoAtivoTamanho) + precoAdicionaisTotal;

  // Preço total (unitário × quantidade)
  const precoTotal = precoUnitarioFinal * quantidade;

  // Descrição da variação para o carrinho
  const descricaoVariacao = temVariacaoPeso && quantidadePesoNum > 0
    ? unidadePeso === "g"
      ? `${quantidadePesoNum}g`
      : `${quantidadePesoNum}kg`
    : opcaoSelecionada;

  function handleAdicionar() {
    if (temVariacaoTamanho && !opcaoSelecionada) {
      setErroVariacao(true);
      return;
    }
    if (ehBolo && listaAdicionais.length > 0 && adicionaisSelecionados.length === 0) {
      setErroRecheio(true);
      return;
    }
    if (temVariacaoPeso && quantidadePesoNum <= 0) {
      setErroVariacao(true);
      return;
    }
    if (temVariacaoPeso && quantidadePesoNum < configPeso.quantidadeMinima) {
      setErroVariacao(true);
      return;
    }

    for (let i = 0; i < quantidade; i++) {
      adicionarItem({
        id: produto.id,
        nome: produto.nome,
        preco: precoUnitarioFinal,
        variacao: descricaoVariacao,
        tipoVariacao: produto.tipoVariacao ?? null,
        unidadePeso: temVariacaoPeso ? unidadePeso : null,
        adicionais: adicionaisSelecionados.length > 0 ? [...adicionaisSelecionados] : null,
      });
    }

    onClose();
  }

  const labelVariacao =
    produto.tipoVariacao === "tamanho"
      ? (ehOpcaoMassa ? "Massa" : "Tamanho")
      : produto.tipoVariacao === "peso"
      ? "Peso"
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} className="text-verde-escuro" />
        </button>

        {/* Imagem em destaque */}
        <div className="w-full h-56 sm:h-64 bg-gray-200 overflow-hidden rounded-t-3xl">
          <img
            src={produto.imagem || IMAGEM_PADRAO}
            alt={produto.nome}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-5">
          {/* Título e preço */}
          <div>
            <h2 className="text-xl font-extrabold text-verde-escuro leading-tight pr-8">
              {produto.nome}
            </h2>
            {temVariacaoTamanho ? (
              <p className="text-sm text-cinza-texto mt-1">
                a partir de{" "}
                <span className="font-extrabold text-verde-normal text-lg">
                  {precoFormatado.format(Math.min(...opcoes.map((o) => o.preco)))}
                </span>
              </p>
            ) : temVariacaoPeso ? (
              <p className="text-sm text-cinza-texto mt-1">
                <span className="font-extrabold text-verde-normal text-lg">
                  {precoFormatado.format(produto.preco)}
                </span>
                {" "}/ kg
                <span className="text-xs text-cinza-texto ml-1">
                  ({precoFormatado.format(produto.preco / 1000)}/g)
                </span>
              </p>
            ) : (
              <p className="text-2xl font-extrabold text-verde-normal mt-2">
                {precoFormatado.format(produto.preco)}
              </p>
            )}
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div>
              <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-1">
                Descrição
              </h3>
              <p className="text-sm text-verde-escuro/80 leading-relaxed">
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Seletor de tamanho ou massa */}
          {temVariacaoTamanho && (
            <div>
              <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-2">
                {ehOpcaoMassa ? "1. Escolha a massa" : "Escolha o tamanho"}
                {erroVariacao && (
                  <span className="ml-2 text-red-500 normal-case tracking-normal font-semibold">
                    Selecione uma opção
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {opcoes.map((opcao) => {
                  const selecionada = opcaoSelecionada === opcao.opcao;
                  return (
                    <button
                      key={opcao.opcao}
                      type="button"
                      onClick={() => {
                        setOpcaoSelecionada(opcao.opcao);
                        setErroVariacao(false);
                      }}
                      className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                        selecionada
                          ? "border-verde-normal bg-verde-normal text-white shadow-md scale-[1.01]"
                          : erroVariacao
                          ? "border-red-300 bg-red-50 text-red-500 hover:border-red-400"
                          : "border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal"
                      }`}
                    >
                      <span className="truncate">{opcao.opcao}</span>
                      <span className={selecionada ? "text-white" : "text-verde-normal"}>
                        {precoFormatado.format(opcao.preco)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Seletor de peso (quantidade + unidade) ─── */}
          {temVariacaoPeso && (
            <div>
              <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Weight size={14} /> Quantidade
                {erroVariacao && (
                  <span className="ml-1 text-red-500 normal-case tracking-normal font-semibold">
                    {quantidadePesoNum <= 0
                      ? "Informe a quantidade"
                      : `Mínimo: ${configPeso.quantidadeMinima}${configPeso.unidadePadrao}`}
                  </span>
                )}
              </h3>

              {/* Toggle de unidade */}
              <div className="flex gap-2 mb-3">
                {(["g", "kg"] as const).map((unidade) => (
                  <button
                    key={unidade}
                    type="button"
                    onClick={() => {
                      setUnidadePeso(unidade);
                      setErroVariacao(false);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                      unidadePeso === unidade
                        ? "border-verde-normal bg-verde-normal text-white"
                        : "border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal/60"
                    }`}
                  >
                    {unidade === "g" ? "Gramas (g)" : "Quilos (kg)"}
                  </button>
                ))}
              </div>

              {/* Input de quantidade */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantidadePeso}
                  onChange={(e) => {
                    // Permite apenas números, vírgula e ponto
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setQuantidadePeso(val);
                    setErroVariacao(false);
                  }}
                  placeholder={unidadePeso === "g" ? "Ex: 250" : "Ex: 1.5"}
                  className={`w-full bg-fundo border-2 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all text-verde-escuro text-center text-lg ${
                    erroVariacao
                      ? "border-red-300 focus:border-red-400"
                      : "border-cinza-borda focus:border-verde-normal"
                  }`}
                />
                <span className="absolute right-4 top-3.5 text-sm text-cinza-texto font-bold">
                  {unidadePeso}
                </span>
              </div>

              {/* Cálculo em tempo real */}
              {quantidadePesoNum > 0 && (
                <div className="mt-3 bg-verde-claro/30 p-3 rounded-xl border border-verde-normal/20 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-cinza-texto">
                      {quantidadePesoNum}{unidadePeso} × {precoFormatado.format(produto.preco)}/kg
                    </span>
                    <span className="font-extrabold text-verde-escuro text-lg">
                      {precoFormatado.format(precoAtivoPeso)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-cinza-texto mt-1.5">
                Mínimo: {configPeso.quantidadeMinima}{configPeso.unidadePadrao} • Use vírgula ou ponto para decimais
              </p>
            </div>
          )}

          {/* Prompt de escolha de massa antes de liberar os recheios */}
          {ehOpcaoMassa && !opcaoSelecionada && listaAdicionais.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-amber-900 uppercase tracking-wider">
                2. Recheios do Bolo
              </p>
              <p className="text-xs text-amber-800">
                Selecione a massa acima (Branca ou Chocolate) para liberar os recheios!
              </p>
            </div>
          )}

          {/* Seletor de Recheios / Adicionais */}
          {listaAdicionais.length > 0 && (!ehOpcaoMassa || Boolean(opcaoSelecionada)) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider">
                    {ehBolo ? "2. Escolha os recheios (até 2 opções)" : "Adicionais (opcional)"}
                  </h3>
                  {erroRecheio && (
                    <span className="text-xs text-red-500 font-bold block mt-0.5">
                      Selecione pelo menos 1 recheio
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {precoAdicionaisTotal > 0 && (
                    <span className="text-xs font-bold text-verde-normal">
                      +{precoFormatado.format(precoAdicionaisTotal)}
                    </span>
                  )}
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      adicionaisSelecionados.length === (ehBolo ? 2 : listaAdicionais.length)
                        ? "bg-verde-normal text-white shadow-xs"
                        : adicionaisSelecionados.length > 0
                        ? "bg-verde-claro/80 text-verde-escuro"
                        : "bg-gray-100 text-cinza-texto"
                    }`}
                  >
                    {adicionaisSelecionados.length}/{ehBolo ? "2" : listaAdicionais.length}
                  </span>
                </div>
              </div>

              {avisoLimite && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl font-bold">
                  ⚠️ Máximo de 2 recheios permitidos! Desmarque um para selecionar outro.
                </div>
              )}

              {/* Filtro rápido se a lista de recheios for grande */}
              {listaAdicionais.length > 6 && (
                <input
                  type="text"
                  value={buscaRecheio}
                  onChange={(e) => setBuscaRecheio(e.target.value)}
                  placeholder="🔍 Buscar recheio (ex: Ninho, Alpino, Abacaxi...)"
                  className="w-full bg-fundo border border-cinza-borda rounded-xl px-3 py-2 text-xs text-verde-escuro placeholder-cinza-texto focus:outline-none focus:border-verde-normal transition-colors"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {listaAdicionais
                  .filter((a) =>
                    buscaRecheio
                      ? a.nome.toLowerCase().includes(buscaRecheio.toLowerCase())
                      : true
                  )
                  .map((adic) => {
                    const selecionado = adicionaisSelecionados.includes(adic.nome);
                    return (
                      <button
                        key={adic.nome}
                        type="button"
                        onClick={() => toggleAdicional(adic.nome)}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border-2 transition-all cursor-pointer text-left ${
                          selecionado
                            ? "border-verde-normal bg-verde-normal/10 text-verde-escuro font-bold shadow-xs"
                            : "border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              selecionado
                                ? "border-verde-normal bg-verde-normal text-white"
                                : "border-cinza-borda bg-white"
                            }`}
                          >
                            {selecionado ? "✓" : ""}
                          </span>
                          <span className="truncate">{adic.nome}</span>
                        </div>
                        {adic.preco > 0 ? (
                          <span className="text-verde-normal font-bold shrink-0">
                            +{precoFormatado.format(adic.preco)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-verde-normal/80 shrink-0 bg-verde-claro/40 px-2 py-0.5 rounded-md">
                            Incluso
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Contador de quantidade (unidades) */}
          <div>
            <h3 className="text-xs font-bold text-cinza-texto uppercase tracking-wider mb-2">
              {temVariacaoPeso ? "Unidades" : "Quantidade"}
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1}
                className="p-2 rounded-xl border border-cinza-borda hover:bg-gray-50 disabled:opacity-30 transition-colors"
                aria-label="Diminuir"
              >
                <Minus size={18} className="text-verde-escuro" />
              </button>
              <span className="text-xl font-extrabold text-verde-escuro w-8 text-center">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={() => setQuantidade(Math.min(99, quantidade + 1))}
                className="p-2 rounded-xl border border-cinza-borda hover:bg-gray-50 transition-colors"
                aria-label="Aumentar"
              >
                <Plus size={18} className="text-verde-escuro" />
              </button>
            </div>
          </div>

          {/* Resumo e botão principal */}
          <div className="border-t border-cinza-borda/50 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-cinza-texto font-medium">Total</span>
              <span className="text-xl font-extrabold text-verde-escuro">
                {precoFormatado.format(precoTotal)}
              </span>
            </div>

            {(opcaoSelecionada || descricaoVariacao) && (
              <p className="text-xs text-cinza-texto">
                {labelVariacao}:{" "}
                <span className="font-bold text-verde-escuro">
                  {descricaoVariacao}
                </span>
                {" — "}
                <span className="font-bold text-verde-normal">
                  {precoFormatado.format(temVariacaoPeso ? precoAtivoPeso : precoAtivoTamanho)}
                </span>
                {temVariacaoPeso ? "" : " / un."}
              </p>
            )}

            {adicionaisSelecionados.length > 0 && (
              <div className="text-xs text-cinza-texto flex flex-wrap items-center gap-1.5">
                <span>Adicionais:</span>
                {adicionaisSelecionados.map((adic) => (
                  <span
                    key={adic}
                    className="inline-block bg-verde-claro/40 text-verde-escuro font-bold px-2 py-0.5 rounded-md border border-verde-normal/20"
                  >
                    +{adic}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdicionar}
              className="w-full bg-verde-normal hover:bg-verde-destaque text-white font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart size={18} />
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
