import { parseOpcoesVariacao, parseAdicionais, produtoEhBoloPersonalizado, type TipoVariacao } from "../contexts/cartStore";

export interface CardProdutoProps {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
  tipoVariacao?: TipoVariacao;
  opcoesVariacao?: string | null;
  adicionais?: string | null;
  onClick: () => void;
}

const IMAGEM_PADRAO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

const precoFormatado = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function CardProduto({
  nome,
  descricao,
  preco,
  imagem,
  tipoVariacao,
  opcoesVariacao,
  adicionais,
  onClick,
}: CardProdutoProps) {
  const opcoes = parseOpcoesVariacao(opcoesVariacao);
  const listaAdicionais = parseAdicionais(adicionais);
  const temVariacaoTamanho = tipoVariacao === "tamanho" && opcoes.length > 0;
  const temVariacaoPeso = tipoVariacao === "peso";
  const temAdicionais = listaAdicionais.length > 0;
  const ehBoloPersonalizado = produtoEhBoloPersonalizado({ nome, tipoVariacao, opcoesVariacao, adicionais });
  const precoMinimo = temVariacaoTamanho ? Math.min(...opcoes.map((o) => o.preco)) : preco;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-3 rounded-2xl shadow-sm border border-cinza-borda/50 flex gap-3 sm:gap-4 items-stretch sm:items-center min-w-0 w-full h-full text-left cursor-pointer hover:shadow-md hover:border-verde-normal/40 active:scale-[0.99] transition-all duration-200 group"
    >
      {/* Imagem */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-verde-normal/30 transition-all">
        <img
          src={imagem || IMAGEM_PADRAO}
          alt={nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-bold text-verde-escuro leading-tight truncate group-hover:text-verde-normal transition-colors">
          {nome}
        </h3>
        <p className="text-sm text-cinza-texto line-clamp-2">
          {ehBoloPersonalizado && /massa/i.test(descricao)
            ? "Escolha até 2 recheios para o seu bolo. Valor combinado pelo WhatsApp."
            : descricao}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          {ehBoloPersonalizado ? (
            <span className="font-bold text-verde-normal text-sm sm:text-base shrink-0">
              Valor definido no WhatsApp
            </span>
          ) : temVariacaoPeso ? (
            <span className="font-bold text-verde-normal text-sm sm:text-base shrink-0">
              {precoFormatado.format(preco)}/kg
            </span>
          ) : temVariacaoTamanho ? (
            <span className="font-bold text-verde-normal text-sm sm:text-base shrink-0">
              a partir de {precoFormatado.format(precoMinimo)}
            </span>
          ) : (
            <span className="font-bold text-verde-normal text-sm sm:text-base shrink-0">
              {precoFormatado.format(preco)}
            </span>
          )}

          {/* Badge de variação disponível */}
          {temVariacaoTamanho && !ehBoloPersonalizado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-verde-claro/50 text-verde-escuro border border-verde-normal/20">
              {opcoes.some((o) => o.opcao.toLowerCase().includes("massa")) ? "Massas" : "Tamanhos"}
              <span className="text-cinza-texto normal-case tracking-normal">
                ({opcoes.length})
              </span>
            </span>
          )}
          {temVariacaoPeso && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-dourado-claro/60 text-dourado-escuro border border-dourado/30">
              Por peso
            </span>
          )}
          {temAdicionais && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-verde-claro/50 text-verde-escuro border border-verde-normal/20">
              {opcoes.some((o) => o.opcao.toLowerCase().includes("massa")) || nome.toLowerCase().includes("bolo")
                ? "Até 2 recheios"
                : "+ Adicionais"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
