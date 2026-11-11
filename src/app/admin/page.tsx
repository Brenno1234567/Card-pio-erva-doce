"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import LogoRodape from "../../components/LogoRodape";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Utensils,
  ArrowLeft,
  Image as ImageIcon,
  Ruler,
  Weight,
  Power,
  PowerOff,
  Check,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  parseOpcoesVariacao,
  parseConfigPeso,
  serializarOpcoesVariacao,
  serializarConfigPeso,
  parseAdicionais,
  serializarAdicionais,
  type OpcaoVariacao,
  type ConfigPeso,
  type Adicional,
} from "../../contexts/cartStore";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  tipoVariacao?: "tamanho" | "peso" | null;
  opcoesVariacao?: string | null;
  adicionais?: string | null;
  status?: "Ativo" | "Inativo";
  canalVisibilidade?: "ambos" | "presencial" | "publico";
  precoDelivery?: number | null;
}

// Utilitário para limpar qualquer emoji de categorias ou textos
const limparEmoji = (texto: string) =>
  texto
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
      ""
    )
    .trim();

export default function PainelAdmin() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ─── ESTADOS DO FORMULÁRIO DE CADASTRO (NO TOPO) ───
  const [cadNome, setCadNome] = useState("");
  const [cadDescricao, setCadDescricao] = useState("");
  const [cadPreco, setCadPreco] = useState("");
  const [cadCanal, setCadCanal] = useState<"ambos" | "presencial" | "publico">("ambos");
  const [cadPrecoDelivery, setCadPrecoDelivery] = useState("");
  const [cadCategoria, setCadCategoria] = useState("Lanches");
  const [cadNovaCategoria, setCadNovaCategoria] = useState("");
  const [cadCriandoNovaCat, setCadCriandoNovaCat] = useState(false);
  const [cadImagem, setCadImagem] = useState("");
  const [cadTipoVariacao, setCadTipoVariacao] = useState<"" | "tamanho" | "peso">("");
  const [cadOpcoesVariacao, setCadOpcoesVariacao] = useState<OpcaoVariacao[]>([]);
  const [cadConfigPeso, setCadConfigPeso] = useState<ConfigPeso>({ unidadePadrao: "g", quantidadeMinima: 1 });
  const [cadAdicionais, setCadAdicionais] = useState<Adicional[]>([]);
  const [cadSalvando, setCadSalvando] = useState(false);
  const [cadFazendoUpload, setCadFazendoUpload] = useState(false);

  // ─── ESTADOS DA TELA/MODAL DE EDIÇÃO DO PRODUTO (AO CLICAR NO LÁPIS) ───
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editCanal, setEditCanal] = useState<"ambos" | "presencial" | "publico">("ambos");
  const [editPrecoDelivery, setEditPrecoDelivery] = useState("");
  const [editCategoria, setEditCategoria] = useState("Lanches");
  const [editNovaCategoria, setEditNovaCategoria] = useState("");
  const [editCriandoNovaCat, setEditCriandoNovaCat] = useState(false);
  const [editImagem, setEditImagem] = useState("");
  const [editTipoVariacao, setEditTipoVariacao] = useState<"" | "tamanho" | "peso">("");
  const [editOpcoesVariacao, setEditOpcoesVariacao] = useState<OpcaoVariacao[]>([]);
  const [editConfigPeso, setEditConfigPeso] = useState<ConfigPeso>({ unidadePadrao: "g", quantidadeMinima: 1 });
  const [editAdicionais, setEditAdicionais] = useState<Adicional[]>([]);
  const [editStatus, setEditStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [editSalvando, setEditSalvando] = useState(false);
  const [editFazendoUpload, setEditFazendoUpload] = useState(false);
  const [filtroAdicionaisEdit, setFiltroAdicionaisEdit] = useState("");

  // ─── SCROLL E ARRASTAR DE CATEGORIAS NO DESKTOP ───
  const categoriasScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleCatMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!categoriasScrollRef.current) return;
    setIsDraggingCat(true);
    setDragStartX(e.pageX - categoriasScrollRef.current.offsetLeft);
    setDragScrollLeft(categoriasScrollRef.current.scrollLeft);
  };

  const handleCatMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCat || !categoriasScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriasScrollRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    categoriasScrollRef.current.scrollLeft = dragScrollLeft - walk;
  };

  const handleCatMouseUpOrLeave = () => {
    setIsDraggingCat(false);
  };

  const rolarCategorias = (direcao: "esq" | "dir") => {
    if (!categoriasScrollRef.current) return;
    categoriasScrollRef.current.scrollBy({
      left: direcao === "esq" ? -300 : 300,
      behavior: "smooth",
    });
  };

  // ─── FILTROS DO CARDÁPIO (EMBAIXO) ───
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [termoPesquisa, setTermoPesquisa] = useState("");

  // ─── GERENCIAMENTO DE CATEGORIAS ───
  const [modalCategorias, setModalCategorias] = useState(false);
  const [categoriaEditandoNome, setCategoriaEditandoNome] = useState<string | null>(null);
  const [categoriaEditandoValor, setCategoriaEditandoValor] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  // Carregar produtos
  const carregarProdutos = async () => {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      if (Array.isArray(data)) setProdutos(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Categorias sem emojis
  const categorias = useMemo(() => {
    const limpas = produtos
      .map((p) => limparEmoji(p.categoria || ""))
      .filter(Boolean);
    return ["Todos", ...Array.from(new Set(limpas)).sort()];
  }, [produtos]);

  const categoriasSemTodos = useMemo(() => {
    return categorias.filter((c) => c !== "Todos");
  }, [categorias]);

  // Se a categoria selecionada no cadastro ainda não estiver definida, ajusta para a primeira
  useEffect(() => {
    if (categoriasSemTodos.length > 0 && !cadCategoria) {
      setCadCategoria(categoriasSemTodos[0]);
    }
  }, [categoriasSemTodos, cadCategoria]);

  // ─── UPLOAD DE IMAGEM CADASTRO ───
  const handleUploadCad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCadFazendoUpload(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setCadImagem(data.url);
      else alert("Erro ao fazer upload da imagem.");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro de conexão ao enviar imagem.");
    } finally {
      setCadFazendoUpload(false);
    }
  };

  // ─── UPLOAD DE IMAGEM EDIÇÃO ───
  const handleUploadEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditFazendoUpload(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setEditImagem(data.url);
      else alert("Erro ao fazer upload da imagem.");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro de conexão ao enviar imagem.");
    } finally {
      setEditFazendoUpload(false);
    }
  };

  // ─── CADASTRAR NOVO PRODUTO ───
  async function cadastrarProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!cadNome.trim() || !cadPreco) return alert("Preencha o nome e o preço do produto!");
    if (cadFazendoUpload) return alert("Aguarde o envio da imagem terminar!");

    const categoriaFinal = limparEmoji(
      cadCriandoNovaCat && cadNovaCategoria.trim() ? cadNovaCategoria.trim() : cadCategoria
    );
    if (!categoriaFinal) return alert("Informe uma categoria para o produto!");

    setCadSalvando(true);
    try {
      let opcoesPayload: string | null = null;
      if (cadTipoVariacao === "tamanho") {
        opcoesPayload = serializarOpcoesVariacao(cadOpcoesVariacao);
      } else if (cadTipoVariacao === "peso") {
        opcoesPayload = serializarConfigPeso(cadConfigPeso);
      }

      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: cadNome.trim(),
          descricao: cadDescricao.trim(),
          preco: Number(cadPreco),
          precoDelivery: cadPrecoDelivery ? Number(cadPrecoDelivery) : null,
          categoria: categoriaFinal,
          canalVisibilidade: cadCanal,
          imagem: cadImagem.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
          tipoVariacao: cadTipoVariacao || null,
          opcoesVariacao: opcoesPayload,
          adicionais: serializarAdicionais(cadAdicionais),
          status: "Ativo",
        }),
      });

      if (res.ok) {
        // Limpar formulário de cadastro
        setCadNome("");
        setCadDescricao("");
        setCadPreco("");
        setCadPrecoDelivery("");
        setCadCanal("ambos");
        setCadNovaCategoria("");
        setCadCriandoNovaCat(false);
        setCadImagem("");
        setCadTipoVariacao("");
        setCadOpcoesVariacao([]);
        setCadConfigPeso({ unidadePadrao: "g", quantidadeMinima: 1 });
        setCadAdicionais([]);
        carregarProdutos();
      } else {
        alert("Erro ao cadastrar produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao salvar produto.");
    } finally {
      setCadSalvando(false);
    }
  }

  // ─── ABRIR TELA DE EDIÇÃO (CLIQUE NO LÁPIS) ───
  const abrirEdicaoProduto = (produto: Produto) => {
    setProdutoEditando(produto);
    setEditNome(produto.nome);
    setEditDescricao(produto.descricao || "");
    setEditPreco(produto.preco.toString());
    setEditPrecoDelivery(produto.precoDelivery !== undefined && produto.precoDelivery !== null ? produto.precoDelivery.toString() : "");
    setEditCanal(produto.canalVisibilidade || "ambos");
    setEditCategoria(limparEmoji(produto.categoria || "Lanches"));
    setEditNovaCategoria("");
    setEditCriandoNovaCat(false);
    setEditImagem(produto.imagem || "");
    setEditTipoVariacao((produto.tipoVariacao as "tamanho" | "peso") || "");
    setEditOpcoesVariacao(parseOpcoesVariacao(produto.opcoesVariacao));
    setEditConfigPeso(parseConfigPeso(produto.tipoVariacao === "peso" ? produto.opcoesVariacao : null));
    setEditAdicionais(parseAdicionais(produto.adicionais));
    setFiltroAdicionaisEdit("");
    setEditStatus(produto.status === "Inativo" ? "Inativo" : "Ativo");
  };

  const fecharEdicao = () => {
    setProdutoEditando(null);
  };

  // ─── SALVAR EDIÇÃO DO PRODUTO ───
  async function salvarEdicaoProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoEditando) return;
    if (!editNome.trim() || !editPreco) return alert("Preencha o nome e o preço do produto!");
    if (editFazendoUpload) return alert("Aguarde o upload da imagem terminar!");

    const categoriaFinal = limparEmoji(
      editCriandoNovaCat && editNovaCategoria.trim() ? editNovaCategoria.trim() : editCategoria
    );
    if (!categoriaFinal) return alert("Informe uma categoria!");

    setEditSalvando(true);
    try {
      let opcoesPayload: string | null = null;
      if (editTipoVariacao === "tamanho") {
        opcoesPayload = serializarOpcoesVariacao(editOpcoesVariacao);
      } else if (editTipoVariacao === "peso") {
        opcoesPayload = serializarConfigPeso(editConfigPeso);
      }

      const res = await fetch(`/api/produtos/${produtoEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editNome.trim(),
          descricao: editDescricao.trim(),
          preco: Number(editPreco),
          precoDelivery: editPrecoDelivery ? Number(editPrecoDelivery) : null,
          categoria: categoriaFinal,
          canalVisibilidade: editCanal,
          imagem: editImagem.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
          tipoVariacao: editTipoVariacao || null,
          opcoesVariacao: opcoesPayload,
          adicionais: serializarAdicionais(editAdicionais),
          status: editStatus,
        }),
      });

      if (res.ok) {
        fecharEdicao();
        carregarProdutos();
      } else {
        alert("Erro ao salvar alterações do produto.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao salvar alterações.");
    } finally {
      setEditSalvando(false);
    }
  }

  // ─── ALTERNAR ATIVO / INATIVO ───
  async function alternarStatus(produto: Produto) {
    const novoStatus = produto.status === "Inativo" ? "Ativo" : "Inativo";
    try {
      const res = await fetch(`/api/produtos/${produto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: produto.nome,
          descricao: produto.descricao,
          preco: produto.preco,
          categoria: limparEmoji(produto.categoria),
          imagem: produto.imagem,
          tipoVariacao: produto.tipoVariacao || null,
          opcoesVariacao: produto.opcoesVariacao || null,
          adicionais: produto.adicionais || null,
          status: novoStatus,
        }),
      });
      if (res.ok) {
        setProdutos((prev) =>
          prev.map((p) => (p.id === produto.id ? { ...p, status: novoStatus } : p))
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  // ─── EXCLUIR PRODUTO ───
  async function excluirProduto(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item do cardápio?")) return;
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProdutos((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Erro ao excluir.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  // ─── RENOMEAR CATEGORIA EM MASSA ───
  async function salvarEdicaoCategoria(catAtual: string) {
    const novoNome = limparEmoji(categoriaEditandoValor.trim());
    if (!novoNome || novoNome === catAtual) {
      setCategoriaEditandoNome(null);
      return;
    }
    setSalvandoCategoria(true);
    try {
      const res = await fetch("/api/categorias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoriaAtual: catAtual, novaCategoria: novoNome }),
      });
      if (res.ok) {
        setCategoriaEditandoNome(null);
        carregarProdutos();
      } else {
        alert("Erro ao renomear categoria.");
      }
    } catch {
      alert("Erro de conexão ao renomear categoria.");
    } finally {
      setSalvandoCategoria(false);
    }
  }

  // ─── FILTRAGEM DE PRODUTOS PARA EXIBIÇÃO ───
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const catLimpa = limparEmoji(p.categoria || "");
      if (termoPesquisa.trim()) {
        const t = termoPesquisa.toLowerCase();
        const n = p.nome.toLowerCase().includes(t);
        const d = (p.descricao || "").toLowerCase().includes(t);
        const c = catLimpa.toLowerCase().includes(t);
        if (!n && !d && !c) return false;
      }
      if (categoriaAtiva !== "Todos" && catLimpa !== categoriaAtiva) {
        return false;
      }
      return true;
    });
  }, [produtos, termoPesquisa, categoriaAtiva]);

  return (
    <div className="min-h-screen bg-fundo-verde text-verde-escuro font-sans pb-20">
      {/* ─── TOPO DA PÁGINA ─── */}
      <header className="bg-fundo-verde border-b border-dourado/25 px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => router.push("/painel-pedidos")}
              className="bg-fundo p-2.5 rounded-2xl border border-cinza-borda text-verde-escuro hover:bg-verde-claro/40 transition-colors shrink-0 cursor-pointer shadow-xs"
              title="Voltar ao Painel da Cozinha"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-dourado-claro block">
                Erva Doce • Gestão
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                Cadastrar Produtos
              </h1>
            </div>
          </div>

          <button
            onClick={() => setModalCategorias(true)}
            className="px-3.5 py-2 rounded-xl border border-cinza-borda bg-fundo hover:bg-white text-xs font-bold text-verde-escuro flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Tag size={15} className="text-dourado-escuro" />
            <span>Gerenciar Categorias</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-10">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 1. FORMULÁRIO DE CADASTRO (NO TOPO DA PÁGINA)                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="bg-white p-5 sm:p-8 rounded-3xl border border-cinza-borda/80 shadow-sm space-y-6">
          <div className="border-b border-cinza-borda/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-verde-escuro flex items-center gap-2">
                <Plus size={20} className="text-verde-normal" /> Cadastrar Novo Produto
              </h2>
              <p className="text-xs text-cinza-texto mt-0.5">
                Preencha os dados abaixo para disponibilizar um novo item no cardápio.
              </p>
            </div>
          </div>

          <form onSubmit={cadastrarProduto} className="space-y-5">
            {/* Linha 1: Nome e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={cadNome}
                  onChange={(e) => setCadNome(e.target.value)}
                  placeholder="Ex: Croissant Artesanal com Recheio de Doce de Leite"
                  className="w-full bg-fundo border border-cinza-borda rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-verde-escuro">
                    Categoria *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCadCriandoNovaCat(!cadCriandoNovaCat)}
                    className="text-[11px] font-bold text-verde-normal hover:underline cursor-pointer"
                  >
                    {cadCriandoNovaCat ? "← Escolher existente" : "+ Criar nova"}
                  </button>
                </div>

                {cadCriandoNovaCat ? (
                  <input
                    type="text"
                    value={cadNovaCategoria}
                    onChange={(e) => setCadNovaCategoria(limparEmoji(e.target.value))}
                    placeholder="Nome da categoria (sem emojis)"
                    className="w-full bg-fundo border border-verde-normal rounded-2xl px-4 py-3 text-sm focus:outline-none font-medium"
                    autoFocus
                  />
                ) : (
                  <select
                    value={cadCategoria}
                    onChange={(e) => setCadCategoria(e.target.value)}
                    className="w-full bg-fundo border border-cinza-borda rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-verde-normal font-medium cursor-pointer"
                  >
                    {categoriasSemTodos.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {!categoriasSemTodos.includes(cadCategoria) && cadCategoria && (
                      <option value={cadCategoria}>{cadCategoria}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Linha 2: Tipo de Preço e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Formato de Venda
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { value: "", label: "Simples" },
                    { value: "tamanho", label: "Tamanhos" },
                    { value: "peso", label: "Por Peso" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const anterior = cadTipoVariacao;
                        setCadTipoVariacao(value as "" | "tamanho" | "peso");
                        if (!value) {
                          setCadOpcoesVariacao([]);
                        } else if (anterior !== value && value === "tamanho" && cadOpcoesVariacao.length === 0) {
                          setCadOpcoesVariacao([
                            { opcao: "P", preco: 0 },
                            { opcao: "M", preco: 0 },
                            { opcao: "G", preco: 0 },
                          ]);
                        }
                      }}
                      className={`py-2.5 text-xs font-extrabold rounded-xl border-2 transition-all cursor-pointer text-center ${
                        cadTipoVariacao === value
                          ? "border-verde-normal bg-verde-normal/10 text-verde-escuro"
                          : "border-cinza-borda bg-fundo text-cinza-texto hover:border-verde-normal/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  {cadTipoVariacao === "peso" ? "Preço por Kg (R$)" : "Preço (R$)"} *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-cinza-texto">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cadPreco}
                    onChange={(e) => setCadPreco(e.target.value)}
                    placeholder={cadTipoVariacao === "peso" ? "Ex: 69.90 (por Kg)" : "Ex: 24.50"}
                    className="w-full bg-fundo border border-cinza-borda rounded-2xl pl-12 pr-4 py-2.5 text-sm font-black focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15"
                    required
                  />
                </div>
              </div>

              {/* Canal de Visibilidade e Preço Delivery */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-fundo/40 p-4 rounded-2xl border border-cinza-borda/60">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                    Onde exibir este produto?
                  </label>
                  <select
                    value={cadCanal}
                    onChange={(e) => setCadCanal(e.target.value as any)}
                    className="w-full bg-white border border-cinza-borda rounded-2xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-verde-normal cursor-pointer text-verde-escuro"
                  >
                    <option value="ambos">Ambos (Salão e Delivery)</option>
                    <option value="presencial">Apenas Presencial (Mesas)</option>
                    <option value="publico">Apenas Público (Encomendas/Delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                    Preço Delivery (Opcional - R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cadPrecoDelivery}
                    onChange={(e) => setCadPrecoDelivery(e.target.value)}
                    placeholder="Se vazio, usa o preço normal"
                    className="w-full bg-white border border-cinza-borda rounded-2xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-verde-normal text-verde-escuro"
                  />
                </div>
              </div>

              {/* Foto do produto */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Foto do Produto
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-fundo border border-cinza-borda overflow-hidden shrink-0 flex items-center justify-center">
                    {cadImagem ? (
                      <img src={cadImagem} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-cinza-texto/50" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCad}
                    disabled={cadFazendoUpload}
                    className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-verde-normal file:text-white hover:file:bg-verde-destaque file:cursor-pointer"
                  />
                </div>
                {cadFazendoUpload && (
                  <p className="text-[11px] text-amber-600 font-bold animate-pulse mt-1">Enviando foto...</p>
                )}
              </div>
            </div>

            {/* Sub-painel: Tamanhos se selecionado */}
            {cadTipoVariacao === "tamanho" && (
              <div className="bg-fundo p-4 rounded-2xl border border-cinza-borda space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-verde-escuro block">
                  Opções de Tamanho e Preço
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {cadOpcoesVariacao.map((opcao, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-cinza-borda">
                      <input
                        type="text"
                        value={opcao.opcao}
                        onChange={(e) => {
                          const n = [...cadOpcoesVariacao];
                          n[index] = { ...n[index], opcao: e.target.value };
                          setCadOpcoesVariacao(n);
                        }}
                        placeholder="Tam"
                        className="w-16 bg-fundo border border-cinza-borda rounded-lg px-2 py-1 text-xs font-bold"
                      />
                      <span className="text-xs font-bold text-cinza-texto">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={opcao.preco || ""}
                        onChange={(e) => {
                          const n = [...cadOpcoesVariacao];
                          n[index] = { ...n[index], preco: Number(e.target.value) || 0 };
                          setCadOpcoesVariacao(n);
                        }}
                        placeholder="0.00"
                        className="flex-1 bg-fundo border border-cinza-borda rounded-lg px-2 py-1 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setCadOpcoesVariacao(cadOpcoesVariacao.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCadOpcoesVariacao([...cadOpcoesVariacao, { opcao: "", preco: 0 }])}
                  className="text-xs font-bold text-verde-normal hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Adicionar tamanho
                </button>
              </div>
            )}

            {/* Sub-painel: Peso se selecionado */}
            {cadTipoVariacao === "peso" && cadPreco && Number(cadPreco) > 0 && (
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex flex-wrap gap-4 items-center">
                <span className="flex items-center gap-1 text-emerald-800">
                  <Weight size={14} /> Prévia de Preços:
                </span>
                <span>100g = {precoFormatado(Number(cadPreco) * 0.1)}</span>
                <span>250g = {precoFormatado(Number(cadPreco) * 0.25)}</span>
                <span>500g = {precoFormatado(Number(cadPreco) * 0.5)}</span>
                <span>1 Kg = {precoFormatado(Number(cadPreco))}</span>
              </div>
            )}

            {/* Sub-painel: Adicionais / Recheios */}
            <div className="bg-fundo p-4 rounded-2xl border border-cinza-borda space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-verde-escuro block">
                  Adicionais / Recheios ({cadAdicionais.length})
                </span>
                <span className="text-[11px] text-cinza-texto">
                  Opcional • R$ 0,00 = Incluso
                </span>
              </div>
              {cadAdicionais.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {cadAdicionais.map((adic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={adic.nome}
                        onChange={(e) => {
                          const n = [...cadAdicionais];
                          n[index] = { ...n[index], nome: e.target.value };
                          setCadAdicionais(n);
                        }}
                        placeholder="Nome (ex: Nutella)"
                        className="flex-1 bg-white border border-cinza-borda rounded-xl px-3 py-1.5 text-xs font-bold"
                      />
                      <span className="text-xs font-bold text-cinza-texto">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={adic.preco === 0 ? "0" : (adic.preco || "")}
                        onChange={(e) => {
                          const n = [...cadAdicionais];
                          n[index] = { ...n[index], preco: Number(e.target.value) || 0 };
                          setCadAdicionais(n);
                        }}
                        placeholder="0.00"
                        className="w-24 bg-white border border-cinza-borda rounded-xl px-3 py-1.5 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setCadAdicionais(cadAdicionais.filter((_, i) => i !== index))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setCadAdicionais([...cadAdicionais, { nome: "", preco: 0 }])}
                className="text-xs font-bold text-verde-normal hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Adicionar recheio / adicional
              </button>
            </div>

            {/* Linha 3: Descrição */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                Descrição dos Ingredientes / Detalhes
              </label>
              <textarea
                value={cadDescricao}
                onChange={(e) => setCadDescricao(e.target.value)}
                placeholder="Ex: Pão de fermentação natural, queijo canastra e toque de mel silvestre."
                rows={2}
                className="w-full bg-fundo border border-cinza-borda rounded-2xl p-3 text-sm focus:outline-none focus:border-verde-normal focus:ring-2 focus:ring-verde-normal/15 resize-none transition-all font-normal"
              />
            </div>

            {/* Botão Cadastrar */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={cadSalvando || cadFazendoUpload}
                className="w-full sm:w-auto bg-verde-normal hover:bg-verde-destaque text-white font-black py-3 px-8 rounded-2xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {cadSalvando ? "Salvando..." : "Cadastrar Produto"}
              </button>
            </div>
          </form>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 2. LISTA DE TODOS OS PRODUTOS (DO MESMO JEITO QUE NA TELA CLIENTE) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-5">
          {/* Cabeçalho da Seção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Utensils size={22} className="text-dourado-claro" /> Itens no Cardápio
              </h2>
              <p className="text-xs sm:text-sm text-white/75">
                Mostrando {produtosFiltrados.length} {produtosFiltrados.length === 1 ? "produto" : "produtos"} • Clique no lápis para editar o item
              </p>
            </div>

            {/* Busca Rápida */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cinza-texto/60" />
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-white border border-cinza-borda rounded-2xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-verde-normal shadow-xs"
              />
              {termoPesquisa && (
                <button
                  onClick={() => setTermoPesquisa("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cinza-texto/60 hover:text-cinza-texto cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Abas de Categorias (com navegação por setas, arrastar com mouse ou rodinha) */}
          <div className="relative group">
            {/* Botão Seta Esquerda */}
            <button
              type="button"
              onClick={() => rolarCategorias("esq")}
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-cinza-borda items-center justify-center text-verde-escuro hover:bg-verde-claro/40 transition-all cursor-pointer opacity-90 hover:opacity-100"
              aria-label="Rolar categorias para a esquerda"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              ref={categoriasScrollRef}
              onMouseDown={handleCatMouseDown}
              onMouseMove={handleCatMouseMove}
              onMouseUp={handleCatMouseUpOrLeave}
              onMouseLeave={handleCatMouseUpOrLeave}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className={`flex gap-2.5 overflow-x-auto no-scrollbar pb-2 select-none px-1 ${
                isDraggingCat ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shadow-xs cursor-pointer shrink-0 ${
                    categoriaAtiva === cat
                      ? "bg-verde-normal text-white shadow-md scale-[1.02]"
                      : "border border-cinza-borda bg-white text-verde-escuro hover:border-verde-normal/60 hover:bg-verde-claro/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Botão Seta Direita */}
            <button
              type="button"
              onClick={() => rolarCategorias("dir")}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-cinza-borda items-center justify-center text-verde-escuro hover:bg-verde-claro/40 transition-all cursor-pointer opacity-90 hover:opacity-100"
              aria-label="Rolar categorias para a direita"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grade de Cards de Produtos (Idêntica ao Cliente com Diferencial do Lápis) */}
          {carregando ? (
            <p className="text-center text-white/80 py-16 font-bold">Carregando produtos...</p>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-cinza-borda p-8">
              <Utensils size={36} className="mx-auto text-cinza-texto/40 mb-2" />
              <p className="font-extrabold text-verde-escuro">Nenhum produto encontrado</p>
              <p className="text-xs text-cinza-texto mt-1">
                {termoPesquisa
                  ? `Nenhum resultado para "${termoPesquisa}".`
                  : `Não há produtos cadastrados na categoria "${categoriaAtiva}".`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {produtosFiltrados.map((produto) => {
                const opcoes = parseOpcoesVariacao(produto.opcoesVariacao);
                const temTamanho = produto.tipoVariacao === "tamanho" && opcoes.length > 0;
                const temPeso = produto.tipoVariacao === "peso";
                const precoMin = temTamanho ? Math.min(...opcoes.map((o) => o.preco)) : produto.preco;
                const isInativo = produto.status === "Inativo";

                return (
                  <div
                    key={produto.id}
                    className={`bg-white p-3.5 rounded-2xl shadow-sm border flex gap-3 sm:gap-4 items-stretch min-w-0 w-full relative transition-all duration-200 group hover:shadow-md overflow-hidden ${
                      isInativo
                        ? "border-red-200 bg-red-50/15 opacity-80"
                        : "border-cinza-borda/60 hover:border-verde-normal/40"
                    }`}
                  >
                    {/* Imagem do Produto */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden ring-1 ring-cinza-borda/40 relative">
                      <img
                        src={produto.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isInativo && (
                        <span className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-[9px] font-black uppercase text-center py-0.5">
                          Pausado
                        </span>
                      )}
                    </div>

                    {/* Conteúdo Central */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Linha Superior: Categoria na esquerda e Ações na direita */}
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-verde-normal truncate">
                            {limparEmoji(produto.categoria)}
                          </span>

                          {/* ─── AÇÕES: BOTÃO DO LÁPIS (EDITAR), STATUS E EXCLUIR ─── */}
                          <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                            {/* Lápis de Edição */}
                            <button
                              type="button"
                              onClick={() => abrirEdicaoProduto(produto)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer shadow-xs"
                              title="Editar produto"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Toggle Ativo/Inativo */}
                            <button
                              type="button"
                              onClick={() => alternarStatus(produto)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isInativo
                                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-emerald-50 hover:text-emerald-700"
                                  : "bg-fundo text-cinza-texto border-cinza-borda hover:bg-red-50 hover:text-red-600"
                              }`}
                              title={isInativo ? "Reativar no cardápio" : "Pausar no cardápio"}
                            >
                              {isInativo ? <PowerOff size={14} /> : <Power size={14} />}
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => excluirProduto(produto.id)}
                              className="p-1.5 rounded-lg bg-fundo text-cinza-texto hover:bg-red-50 hover:text-red-600 border border-cinza-borda hover:border-red-200 transition-all cursor-pointer"
                              title="Excluir produto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-verde-escuro text-sm sm:text-base leading-tight truncate">
                          {produto.nome}
                        </h3>
                        <p className="text-xs text-cinza-texto line-clamp-2 mt-0.5">
                          {produto.descricao || "Sem descrição."}
                        </p>
                      </div>

                      {/* Preço e badges */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-cinza-borda/30">
                        <span className="font-black text-verde-normal text-sm sm:text-base">
                          {temPeso ? (
                            `${precoFormatado(produto.preco)}/kg`
                          ) : temTamanho ? (
                            `a partir de ${precoFormatado(precoMin)}`
                          ) : (
                            precoFormatado(produto.preco)
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {temTamanho && (
                            <span className="text-[10px] font-bold text-cinza-texto bg-fundo px-2 py-0.5 rounded-md border border-cinza-borda">
                              {opcoes.length} tamanhos
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              produto.canalVisibilidade === "presencial"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : produto.canalVisibilidade === "publico"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {produto.canalVisibilidade === "presencial"
                              ? "Salão"
                              : produto.canalVisibilidade === "publico"
                              ? "Delivery"
                              : "Ambos"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <LogoRodape />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. TELA / MODAL DEDICADA DE EDIÇÃO (AO CLICAR NO LÁPIS)            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {produtoEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-cinza-borda max-w-2xl w-full my-auto shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho da Tela de Edição */}
            <div className="px-6 py-4 border-b border-cinza-borda/60 flex items-center justify-between bg-fundo">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 block">
                  Edição de Item
                </span>
                <h2 className="text-lg font-black text-verde-escuro flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-500" />
                  Editar: {produtoEditando.nome}
                </h2>
              </div>
              <button
                onClick={fecharEdicao}
                className="p-2 rounded-xl bg-white border border-cinza-borda text-cinza-texto hover:text-red-500 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário Só Para Esse Produto */}
            <form onSubmit={salvarEdicaoProduto} className="p-6 space-y-5 max-h-[calc(90vh-130px)] overflow-y-auto">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-fundo border border-cinza-borda rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-verde-normal font-medium"
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-verde-escuro">
                    Categoria *
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditCriandoNovaCat(!editCriandoNovaCat)}
                    className="text-xs font-bold text-verde-normal hover:underline cursor-pointer"
                  >
                    {editCriandoNovaCat ? "← Escolher existente" : "+ Criar nova"}
                  </button>
                </div>

                {editCriandoNovaCat ? (
                  <input
                    type="text"
                    value={editNovaCategoria}
                    onChange={(e) => setEditNovaCategoria(limparEmoji(e.target.value))}
                    placeholder="Nome da categoria (sem emojis)"
                    className="w-full bg-fundo border border-verde-normal rounded-2xl px-4 py-2.5 text-sm focus:outline-none font-medium"
                    autoFocus
                  />
                ) : (
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full bg-fundo border border-cinza-borda rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-verde-normal font-medium cursor-pointer"
                  >
                    {categoriasSemTodos.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {!categoriasSemTodos.includes(editCategoria) && editCategoria && (
                      <option value={editCategoria}>{editCategoria}</option>
                    )}
                  </select>
                )}
              </div>

              {/* Formato de Preço */}
              <div className="space-y-3 pt-2 border-t border-cinza-borda/60">
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro">
                  Formato de Venda e Preço
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "", label: "Preço Simples" },
                    { value: "tamanho", label: "Tamanhos" },
                    { value: "peso", label: "Por Peso" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const anterior = editTipoVariacao;
                        setEditTipoVariacao(value as "" | "tamanho" | "peso");
                        if (!value) {
                          setEditOpcoesVariacao([]);
                        } else if (anterior !== value && value === "tamanho" && editOpcoesVariacao.length === 0) {
                          setEditOpcoesVariacao([
                            { opcao: "P", preco: 0 },
                            { opcao: "M", preco: 0 },
                            { opcao: "G", preco: 0 },
                          ]);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer text-center ${
                        editTipoVariacao === value
                          ? "border-verde-normal bg-verde-normal/10 text-verde-escuro"
                          : "border-cinza-borda bg-fundo text-cinza-texto"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza-texto mb-1">
                    {editTipoVariacao === "peso" ? "Preço por Kg (R$)" : "Preço Base (R$)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-cinza-texto">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPreco}
                      onChange={(e) => setEditPreco(e.target.value)}
                      className="w-full bg-fundo border border-cinza-borda rounded-2xl pl-10 pr-4 py-2.5 text-sm font-black focus:outline-none focus:border-verde-normal"
                      required
                    />
                  </div>
                </div>

                {editTipoVariacao === "tamanho" && (
                  <div className="bg-fundo p-4 rounded-2xl border border-cinza-borda space-y-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-verde-escuro block">
                      Tamanhos e Preços
                    </span>
                    {editOpcoesVariacao.map((opcao, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opcao.opcao}
                          onChange={(e) => {
                            const n = [...editOpcoesVariacao];
                            n[index] = { ...n[index], opcao: e.target.value };
                            setEditOpcoesVariacao(n);
                          }}
                          placeholder="Opção"
                          className="flex-1 bg-white border border-cinza-borda rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <span className="text-xs font-bold text-cinza-texto">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={opcao.preco || ""}
                          onChange={(e) => {
                            const n = [...editOpcoesVariacao];
                            n[index] = { ...n[index], preco: Number(e.target.value) || 0 };
                            setEditOpcoesVariacao(n);
                          }}
                          placeholder="0.00"
                          className="w-28 bg-white border border-cinza-borda rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setEditOpcoesVariacao(editOpcoesVariacao.filter((_, i) => i !== index))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditOpcoesVariacao([...editOpcoesVariacao, { opcao: "", preco: 0 }])}
                      className="text-xs font-bold text-verde-normal hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Adicionar tamanho
                    </button>
                  </div>
                )}
              </div>

              {/* Adicionais / Recheios */}
              <div className="bg-fundo p-4 rounded-2xl border border-cinza-borda space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-verde-escuro block">
                    Adicionais / Recheios ({editAdicionais.length})
                  </span>
                  <span className="text-[11px] text-cinza-texto">
                    R$ 0,00 = Incluso
                  </span>
                </div>

                {editAdicionais.length > 0 && (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {editAdicionais.map((adic, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={adic.nome}
                          onChange={(e) => {
                            const n = [...editAdicionais];
                            n[index] = { ...n[index], nome: e.target.value };
                            setEditAdicionais(n);
                          }}
                          placeholder="Nome (ex: Ninho com Nutella)"
                          className="flex-1 bg-white border border-cinza-borda rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <span className="text-xs font-bold text-cinza-texto">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={adic.preco === 0 ? "0" : (adic.preco || "")}
                          onChange={(e) => {
                            const n = [...editAdicionais];
                            n[index] = { ...n[index], preco: Number(e.target.value) || 0 };
                            setEditAdicionais(n);
                          }}
                          placeholder="0.00"
                          className="w-24 bg-white border border-cinza-borda rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setEditAdicionais(editAdicionais.filter((_, i) => i !== index))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setEditAdicionais([...editAdicionais, { nome: "", preco: 0 }])}
                  className="text-xs font-bold text-verde-normal hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Plus size={13} /> Adicionar recheio / adicional
                </button>
              </div>

              {/* Foto */}
              <div className="pt-2 border-t border-cinza-borda/60">
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Foto do Produto
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-fundo border border-cinza-borda overflow-hidden shrink-0 flex items-center justify-center">
                    {editImagem ? (
                      <img src={editImagem} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-cinza-texto/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadEdit}
                      disabled={editFazendoUpload}
                      className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-verde-normal file:text-white hover:file:bg-verde-destaque file:cursor-pointer"
                    />
                    <input
                      type="url"
                      value={editImagem}
                      onChange={(e) => setEditImagem(e.target.value)}
                      placeholder="Ou cole a URL direta da imagem..."
                      className="w-full bg-fundo border border-cinza-borda rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  rows={2}
                  className="w-full bg-fundo border border-cinza-borda rounded-2xl p-3 text-sm focus:outline-none focus:border-verde-normal resize-none font-normal"
                />
              </div>

              {/* Status */}
              <div className="pt-2 border-t border-cinza-borda/60">
                <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-2">
                  Disponibilidade no Cardápio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditStatus("Ativo")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editStatus === "Ativo"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-cinza-borda bg-fundo text-cinza-texto"
                    }`}
                  >
                    <Power size={14} /> Ativo no Cardápio
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("Inativo")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editStatus === "Inativo"
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-cinza-borda bg-fundo text-cinza-texto"
                    }`}
                  >
                    <PowerOff size={14} /> Pausado (Oculto)
                  </button>
                </div>
              </div>

              {/* Canal de Visibilidade e Preço Delivery na Edição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-fundo/40 p-4 rounded-2xl border border-cinza-borda/60">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                    Onde exibir este produto?
                  </label>
                  <select
                    value={editCanal}
                    onChange={(e) => setEditCanal(e.target.value as any)}
                    className="w-full bg-white border border-cinza-borda rounded-2xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-verde-normal cursor-pointer text-verde-escuro"
                  >
                    <option value="ambos">Ambos (Salão e Delivery)</option>
                    <option value="presencial">Apenas Presencial (Mesas)</option>
                    <option value="publico">Apenas Público (Encomendas/Delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-verde-escuro mb-1.5">
                    Preço Delivery (Opcional - R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrecoDelivery}
                    onChange={(e) => setEditPrecoDelivery(e.target.value)}
                    placeholder="Se vazio, usa o preço normal"
                    className="w-full bg-white border border-cinza-borda rounded-2xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-verde-normal text-verde-escuro"
                  />
                </div>
              </div>

              {/* Botões Salvar Edição */}
              <div className="pt-4 border-t border-cinza-borda flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharEdicao}
                  className="px-5 py-2.5 rounded-xl border border-cinza-borda text-xs font-extrabold text-cinza-texto hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSalvando || editFazendoUpload}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {editSalvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL DE GERENCIAMENTO DE CATEGORIAS (SEM EMOJIS)                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modalCategorias && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-cinza-borda max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cinza-borda/60">
              <h3 className="font-black text-base text-verde-escuro flex items-center gap-2">
                <Tag size={18} className="text-dourado-escuro" /> Categorias do Cardápio
              </h3>
              <button
                onClick={() => setModalCategorias(false)}
                className="p-1.5 rounded-xl text-cinza-texto hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-cinza-texto">
              Clique no lápis para renomear qualquer categoria. Todos os produtos vinculados a ela serão atualizados automaticamente.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categoriasSemTodos.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-2xl bg-fundo border border-cinza-borda"
                >
                  {categoriaEditandoNome === cat ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={categoriaEditandoValor}
                        onChange={(e) => setCategoriaEditandoValor(limparEmoji(e.target.value))}
                        className="flex-1 bg-white border border-verde-normal rounded-xl px-3 py-1.5 text-xs font-bold text-verde-escuro focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => salvarEdicaoCategoria(cat)}
                        disabled={salvandoCategoria}
                        className="p-1.5 bg-verde-normal text-white rounded-xl cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setCategoriaEditandoNome(null)}
                        className="p-1.5 bg-gray-200 text-cinza-texto rounded-xl cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-extrabold text-sm text-verde-escuro">{cat}</span>
                      <button
                        onClick={() => {
                          setCategoriaEditandoNome(cat);
                          setCategoriaEditandoValor(cat);
                        }}
                        className="p-2 text-dourado-escuro hover:bg-white rounded-xl border border-transparent hover:border-cinza-borda transition-colors cursor-pointer"
                        title="Renomear Categoria"
                      >
                        <Edit3 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setModalCategorias(false)}
              className="w-full bg-verde-normal text-white py-2.5 rounded-xl font-bold text-xs hover:bg-verde-destaque transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
