import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TipoVariacao = "tamanho" | "peso" | null;

/** Configuração de peso para produtos vendidos por Kg */
export interface ConfigPeso {
  unidadePadrao: "g" | "kg";
  quantidadeMinima: number;
}

/** Cada opção de variação tem seu próprio preço (usado para tamanho) */
export interface OpcaoVariacao {
  opcao: string;
  preco: number;
}

/** Faz parse do JSON de opções de variação (formato: [{"opcao":"P","preco":15}]) */
export function parseOpcoesVariacao(json: string | null | undefined): OpcaoVariacao[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o: unknown): o is OpcaoVariacao =>
        typeof o === "object" && o !== null &&
        typeof (o as OpcaoVariacao).opcao === "string" &&
        typeof (o as OpcaoVariacao).preco === "number"
      )
      .map((o) => ({ opcao: String(o.opcao).trim(), preco: Number(o.preco) }))
      .filter((o) => o.opcao);
  } catch {
    // Fallback para formato antigo (comma-separated)
    if (typeof json !== "string") return [];
    return json
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .map((opcao) => ({ opcao, preco: 0 }));
  }
}

/** Faz parse da configuração de peso do JSON */
export function parseConfigPeso(json: string | null | undefined): ConfigPeso {
  if (!json) return { unidadePadrao: "g", quantidadeMinima: 1 };
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        unidadePadrao: parsed.unidadePadrao === "kg" ? "kg" : "g",
        quantidadeMinima: Number(parsed.quantidadeMinima) > 0 ? Number(parsed.quantidadeMinima) : 1,
      };
    }
  } catch {
    // ignore
  }
  return { unidadePadrao: "g", quantidadeMinima: 1 };
}

/** Serializa array de opções para string JSON (armazenar no banco) */
export function serializarOpcoesVariacao(opcoes: OpcaoVariacao[]): string {
  return JSON.stringify(opcoes.filter((o) => o.opcao && o.preco >= 0));
}

/** Serializa configuração de peso para JSON */
export function serializarConfigPeso(config: ConfigPeso): string {
  return JSON.stringify(config);
}

/**
 * Calcula o preço com precisão para produtos por peso.
 * Usa aritmética inteira (centavos) para evitar erros de ponto flutuante.
 * - precoPorKg: preço por quilograma em reais
 * - quantidade: valor digitado pelo usuário
 * - unidade: "g" para gramas, "kg" para quilos
 */
export function calcularPrecoPorPeso(
  precoPorKg: number,
  quantidade: number,
  unidade: "g" | "kg"
): number {
  // Converte tudo para centavos (inteiros) para evitar floating-point issues
  const precoCentavos = Math.round(precoPorKg * 100);
  let totalCentavos: number;

  if (unidade === "kg") {
    // quantidade * precoPorKg em centavos
    totalCentavos = Math.round(quantidade * precoCentavos);
  } else {
    // Gramas: (quantidade / 1000) * precoPorKg = (quantidade * precoCentavos) / 1000
    totalCentavos = Math.round((quantidade * precoCentavos) / 1000);
  }

  return totalCentavos / 100;
}

/** Opção de adicional (ex: Nutella, Caramelo, Bacon) */
export interface Adicional {
  nome: string;
  preco: number;
}

/** Faz parse do JSON de adicionais */
export function parseAdicionais(json: string | null | undefined): Adicional[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a: unknown): a is Adicional =>
        typeof a === "object" && a !== null &&
        typeof (a as Adicional).nome === "string" &&
        typeof (a as Adicional).preco === "number"
      )
      .map((a) => ({ nome: String(a.nome).trim(), preco: Number(a.preco) }))
      .filter((a) => a.nome && a.preco >= 0);
  } catch {
    return [];
  }
}

/** Serializa lista de adicionais para string JSON */
export function serializarAdicionais(adicionais: Adicional[]): string | null {
  const validos = adicionais.filter((a) => a.nome.trim() && a.preco >= 0);
  return validos.length > 0 ? JSON.stringify(validos) : null;
}

export interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  variacao?: string | null;
  tipoVariacao?: TipoVariacao;
  /** Para produtos por peso: unidade selecionada ("g" | "kg") */
  unidadePeso?: "g" | "kg" | null;
  /** Nomes dos adicionais escolhidos */
  adicionais?: string[] | null;
}

/** Gera uma chave única que combina produto + variação + unidade de peso + adicionais */
function chaveItem(item: Pick<ItemCarrinho, "id" | "variacao" | "unidadePeso" | "adicionais">): string {
  let chave = item.id;
  if (item.variacao) chave += `::${item.variacao}`;
  if (item.unidadePeso) chave += `::${item.unidadePeso}`;
  if (item.adicionais && item.adicionais.length > 0) {
    chave += `::+${[...item.adicionais].sort().join(",")}`;
  }
  return chave;
}

interface CartState {
  itens: ItemCarrinho[];
  mesa: string | null;
  adicionarItem: (produto: {
    id: string;
    nome: string;
    preco: number;
    variacao?: string | null;
    tipoVariacao?: TipoVariacao;
    unidadePeso?: "g" | "kg" | null;
    adicionais?: string[] | null;
  }) => void;
  removerItem: (id: string, variacao?: string | null, unidadePeso?: "g" | "kg" | null, adicionais?: string[] | null) => void;
  alterarQuantidade: (id: string, quantidade: number, variacao?: string | null, unidadePeso?: "g" | "kg" | null, adicionais?: string[] | null) => void;
  limparCarrinho: () => void;
  definirMesa: (mesa: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itens: [],
      mesa: null,

      adicionarItem: (produto) =>
        set((state) => {
          const chave = chaveItem(produto);
          const itemExiste = state.itens.find((item) => chaveItem(item) === chave);

          if (itemExiste) {
            return {
              itens: state.itens.map((item) =>
                chaveItem(item) === chave
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
              ),
            };
          }

          return {
            itens: [
              ...state.itens,
              {
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: 1,
                variacao: produto.variacao ?? null,
                tipoVariacao: produto.tipoVariacao ?? null,
                unidadePeso: produto.unidadePeso ?? null,
                adicionais: produto.adicionais ?? null,
              },
            ],
          };
        }),

      removerItem: (id, variacao, unidadePeso, adicionais) =>
        set((state) => {
          const chave = chaveItem({ id, variacao, unidadePeso, adicionais });
          return { itens: state.itens.filter((item) => chaveItem(item) !== chave) };
        }),

      alterarQuantidade: (id, quantidade, variacao, unidadePeso, adicionais) =>
        set((state) => {
          const chave = chaveItem({ id, variacao, unidadePeso, adicionais });
          if (quantidade <= 0) {
            return { itens: state.itens.filter((item) => chaveItem(item) !== chave) };
          }
          return {
            itens: state.itens.map((item) =>
              chaveItem(item) === chave ? { ...item, quantidade } : item
            ),
          };
        }),

      limparCarrinho: () => set({ itens: [] }),
      definirMesa: (mesa) => set({ mesa }),
    }),
    { name: "erva-doce-cart" }
  )
);
