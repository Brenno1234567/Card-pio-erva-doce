"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Settings,
  LogOut,
  Pencil,
  CheckCircle,
  Clock,
  History,
  ChefHat,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Flame,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  MessageCircle,
  Bike,
  Store,
  MapPin,
  Calendar,
} from "lucide-react";
import { pusherClient } from "../../lib/pusher";
import LogoRodape from "../../components/LogoRodape";

interface ItemPedido {
  id: string;
  produtoNome: string;
  quantidade: number;
}

interface Pedido {
  id: string;
  origem?: string;
  mesa: string | null;
  cliente: string;
  status: string;
  observacao: string | null;
  total: number;
  criadoEm: string;
  telefone?: string | null;
  tipoPedido?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  pontoReferencia?: string | null;
  formaPagamento?: string | null;
  trocoPara?: string | null;
  taxaEntrega?: number | null;
  dataHoraEntrega?: string | null;
  itens: ItemPedido[];
}

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [somHabilitado, setSomHabilitado] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [horaAtual, setHoraAtual] = useState("");
  const [abaAtivaMobile, setAbaAtivaMobile] = useState<"pendente" | "preparando" | "pronto">("pendente");
  const [itensChecados, setItensChecados] = useState<Record<string, boolean>>({});
  const [filtroOrigem, setFiltroOrigem] = useState<"todas" | "presencial" | "encomenda">("todas");
  const router = useRouter();

  const totalPedidosAnteriorRef = useRef<number>(0);

  // Relógio digital em tempo real para a cozinha
  useEffect(() => {
    const atualizarRelogio = () => {
      setHoraAtual(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    atualizarRelogio();
    const interval = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tocar bip sonoro suave na chegada de novo pedido
  const tocarBipCozinha = useCallback(() => {
    if (!somHabilitado) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Ignora erro de política de áudio
    }
  }, [somHabilitado]);

  const carregarPedidos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setAtualizando(true);
      try {
        const res = await fetch("/api/pedidos", { cache: "no-store" });
        const data = await res.json();

        let listaPedidos: Pedido[] = [];
        if (Array.isArray(data)) {
          listaPedidos = data;
        } else if (Array.isArray(data?.pedidos)) {
          listaPedidos = data.pedidos;
        } else if (Array.isArray(data?.data)) {
          listaPedidos = data.data;
        }

        const novosPendentes = listaPedidos.filter((p) => p.status === "pendente").length;
        if (totalPedidosAnteriorRef.current > 0 && novosPendentes > totalPedidosAnteriorRef.current) {
          tocarBipCozinha();
        }
        totalPedidosAnteriorRef.current = novosPendentes;

        setPedidos(listaPedidos);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        if (!silencioso) setCarregando(false);
        setAtualizando(false);
      }
    },
    [tocarBipCozinha]
  );

  useEffect(() => {
    carregarPedidos();
    const intervalo = setInterval(() => {
      carregarPedidos(true);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [carregarPedidos]);

  useEffect(() => {
    const client = pusherClient;
    if (!client) return;

    const channel = client.subscribe("canal-restaurante");

    channel.bind("novo-pedido", () => {
      tocarBipCozinha();
      carregarPedidos(true);
    });

    channel.bind("status-atualizado", () => {
      carregarPedidos(true);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe("canal-restaurante");
    };
  }, [carregarPedidos, tocarBipCozinha]);

  async function atualizarStatus(id: string, novoStatus: string) {
    try {
      const res = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus }),
      });

      if (res.ok) {
        carregarPedidos(true);
      } else {
        alert("Erro ao atualizar o pedido.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao atualizar status.");
    }
  }

  const toggleCheckItem = (pedidoId: string, itemId: string) => {
    const key = `${pedidoId}-${itemId}`;
    setItensChecados((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("erva_doce_user");
      router.push("/login");
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
    }
  };

  const horaFormatada = (data: string) => {
    try {
      return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const calcularMinutos = (data: string) => {
    try {
      const diffMs = Date.now() - new Date(data).getTime();
      return Math.floor(diffMs / 60000);
    } catch {
      return 0;
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const ehEncomenda = (p.origem && p.origem !== "presencial") || Boolean(p.telefone);
    if (filtroOrigem === "presencial") return !ehEncomenda;
    if (filtroOrigem === "encomenda") return ehEncomenda;
    return true;
  });

  const novos = pedidosFiltrados.filter((p) => p.status === "pendente");
  const emPreparo = pedidosFiltrados.filter((p) => p.status === "preparando");
  const prontos = pedidosFiltrados.filter((p) => p.status === "pronto");

  const renderCabecalhoPedido = (pedido: Pedido) => {
    const ehEncomenda = (pedido.origem && pedido.origem !== "presencial") || Boolean(pedido.telefone);

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block bg-fundo text-verde-escuro font-black text-sm sm:text-base px-2.5 py-0.5 rounded-lg border border-cinza-borda/60">
            {pedido.mesa || (pedido.tipoPedido === "entrega" ? "Delivery" : "Retirada")}
          </span>
          {ehEncomenda && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-dourado/20 text-dourado-escuro border border-dourado/30">
              WhatsApp
            </span>
          )}
          {pedido.telefone && (
            <a
              href={`https://wa.me/${pedido.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors cursor-pointer"
              title="Abrir WhatsApp do cliente"
            >
              <MessageCircle size={11} /> WhatsApp
            </a>
          )}
        </div>
        <p className="text-xs text-cinza-texto mt-1">
          Cliente: <strong className="text-verde-escuro font-bold">{pedido.cliente}</strong>
        </p>
        {pedido.dataHoraEntrega && (
          <p className="text-[11px] text-dourado-escuro font-bold mt-0.5 flex items-center gap-1">
            <Calendar size={11} /> {pedido.dataHoraEntrega}
          </p>
        )}
        {pedido.endereco && (
          <p className="text-[11px] text-cinza-texto mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> {pedido.endereco} {pedido.bairro ? `(${pedido.bairro})` : ""}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-fundo-verde text-verde-escuro font-sans">
      {/* ─── Sidebar Desktop ─── */}
      <aside className="hidden md:flex w-20 bg-verde-escuro flex-col items-center justify-between py-6 shrink-0 border-r border-dourado/25 shadow-sm">
        <div className="flex flex-col items-center">
          <nav className="flex flex-col items-center gap-2.5 text-white/70">
            <Link
              href="/painel-pedidos"
              className="bg-verde-normal p-3 rounded-2xl text-white shadow-md ring-1 ring-dourado/40 transition-all"
              title="Painel da Cozinha"
            >
              <ChefHat size={22} />
            </Link>
            <Link
              href="/historico-pedidos"
              className="p-3 hover:text-dourado hover:bg-white/10 rounded-2xl transition-colors"
              title="Histórico de Pedidos"
            >
              <History size={22} />
            </Link>
            <span className="block w-8 h-px bg-dourado/30 my-1.5" aria-hidden="true" />
            <Link
              href="/admin"
              className="p-3 hover:text-dourado hover:bg-white/10 rounded-2xl transition-colors"
              title="Cardápio"
            >
              <Pencil size={22} />
            </Link>
            <Link
              href="/users"
              className="p-3 hover:text-dourado hover:bg-white/10 rounded-2xl transition-colors"
              title="Gerenciar Equipe"
            >
              <Users size={22} />
            </Link>
            <Link
              href="/settings"
              className="p-3 hover:text-dourado hover:bg-white/10 rounded-2xl transition-colors"
              title="Configurações"
            >
              <Settings size={22} />
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 text-white/60">
          <button
            onClick={handleLogout}
            className="p-3 hover:text-red-300 hover:bg-red-500/20 rounded-2xl transition-colors cursor-pointer"
            title="Sair do sistema"
          >
            <LogOut size={22} />
          </button>
        </div>
      </aside>

      {/* ─── Conteúdo Principal ─── */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 overflow-x-hidden">
        {/* Topbar Clean */}
        <header className="bg-fundo-verde border-b border-dourado/25 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs sticky top-0 z-20">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dourado-claro" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-dourado-claro">
                  Erva Doce • Cozinha
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Painel de Preparo
              </h1>
            </div>

            {/* Relógio Digital Discreto */}
            {horaAtual && (
              <div className="hidden lg:flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold text-white">
                <Clock size={15} className="text-dourado-claro" />
                <span>{horaAtual}</span>
              </div>
            )}
          </div>

          {/* Controles de Topo Neutros */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center">
            {/* Toggle de Som */}
            <button
              onClick={() => {
                setSomHabilitado(!somHabilitado);
                if (!somHabilitado) tocarBipCozinha();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                somHabilitado
                  ? "bg-fundo border-cinza-borda text-verde-escuro"
                  : "bg-gray-100 border-gray-300 text-gray-400"
              }`}
              title={somHabilitado ? "Alerta sonoro ativado" : "Alerta sonoro desativado"}
            >
              {somHabilitado ? <Volume2 size={16} className="text-verde-normal" /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{somHabilitado ? "Som Ativo" : "Mudo"}</span>
            </button>

            {/* Atualizar */}
            <button
              onClick={() => carregarPedidos()}
              disabled={atualizando}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-cinza-borda text-verde-escuro text-xs font-bold hover:bg-fundo transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Recarregar pedidos"
            >
              <RefreshCw size={15} className={atualizando ? "animate-spin text-verde-normal" : "text-cinza-texto"} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-cinza-borda text-verde-escuro text-xs font-bold hover:bg-fundo transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Modo Tela Cheia"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          </div>
        </header>

        {/* ─── Seletor de Origem: Todos | Salão / Mesas | Encomendas & WhatsApp ─── */}
        <div className="px-4 sm:px-6 pt-3 pb-1">
          <div className="flex bg-white p-1 rounded-2xl border border-cinza-borda shadow-xs gap-1 max-w-md">
            <button
              onClick={() => setFiltroOrigem("todas")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroOrigem === "todas"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              Todos ({pedidos.length})
            </button>
            <button
              onClick={() => setFiltroOrigem("presencial")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroOrigem === "presencial"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              Salão ({pedidos.filter((p) => (p.origem || "presencial") === "presencial" && !p.telefone).length})
            </button>
            <button
              onClick={() => setFiltroOrigem("encomenda")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroOrigem === "encomenda"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              WhatsApp ({pedidos.filter((p) => (p.origem && p.origem !== "presencial") || Boolean(p.telefone)).length})
            </button>
          </div>
        </div>

        {/* ─── Seletor de Abas no Mobile ─── */}
        <div className="px-4 pt-3 pb-1 md:hidden">
          <div className="flex bg-white p-1 rounded-2xl border border-cinza-borda">
            <button
              onClick={() => setAbaAtivaMobile("pendente")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                abaAtivaMobile === "pendente"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              Novos ({novos.length})
            </button>
            <button
              onClick={() => setAbaAtivaMobile("preparando")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                abaAtivaMobile === "preparando"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              No Fogo ({emPreparo.length})
            </button>
            <button
              onClick={() => setAbaAtivaMobile("pronto")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                abaAtivaMobile === "pronto"
                  ? "bg-verde-normal text-white shadow-xs"
                  : "text-cinza-texto hover:text-verde-escuro"
              }`}
            >
              Prontos ({prontos.length})
            </button>
          </div>
        </div>

        {/* ─── Quadro Kanban da Cozinha (Cores Neutras e Elegantes) ─── */}
        <div className="flex-1 p-4 sm:p-6 sm:pt-4">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/80 gap-3">
              <RefreshCw size={26} className="animate-spin text-dourado-claro" />
              <p className="font-bold text-sm">Carregando pedidos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start max-w-7xl mx-auto">
              {/* ══════════ COLUNA 1: NOVOS PEDIDOS (PENDENTES) ══════════ */}
              <div
                className={`flex flex-col rounded-2xl border border-cinza-borda/80 bg-white shadow-xs overflow-hidden ${
                  abaAtivaMobile !== "pendente" ? "hidden md:flex" : "flex"
                }`}
              >
                {/* Cabeçalho da Coluna */}
                <div className="px-4 py-3.5 border-b border-cinza-borda/60 bg-fundo/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-dourado-escuro" />
                    <h2 className="font-extrabold text-verde-escuro text-sm sm:text-base">
                      Novos Pedidos
                    </h2>
                  </div>
                  <span className="bg-white text-verde-escuro font-bold text-xs px-2.5 py-0.5 rounded-full border border-cinza-borda">
                    {novos.length}
                  </span>
                </div>

                <div className="p-3 sm:p-4 space-y-3 max-h-[calc(100vh-170px)] overflow-y-auto">
                  {novos.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cinza-borda/80 bg-fundo/30">
                      <ChefHat size={32} className="mx-auto text-cinza-texto/40 mb-1.5" />
                      <p className="text-xs font-bold text-verde-escuro">Nenhum pedido novo</p>
                      <p className="text-[11px] text-cinza-texto mt-0.5">Aguardando novos clientes.</p>
                    </div>
                  ) : (
                    novos.map((pedido) => {
                      const minutos = calcularMinutos(pedido.criadoEm);
                      const isAtrasado = minutos >= 15;

                      return (
                        <div
                          key={pedido.id}
                          className="bg-white rounded-xl p-4 border border-cinza-borda/80 hover:border-cinza-borda hover:shadow-sm transition-all space-y-3"
                        >
                          {/* Cabeçalho do Card */}
                          <div className="flex justify-between items-start gap-2">
                            {renderCabecalhoPedido(pedido)}

                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
                                isAtrasado
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-fundo text-cinza-texto border-cinza-borda"
                              }`}
                            >
                              <Clock size={12} />
                              {horaFormatada(pedido.criadoEm)}
                              <span className="text-[10px] font-normal">({minutos}m)</span>
                            </span>
                          </div>

                          {/* Observação Suave */}
                          {pedido.observacao && (
                            <div className="bg-[#FAF2EB] border border-[#E7D7C4] p-2.5 rounded-lg flex items-start gap-2 text-xs text-verde-escuro">
                              <AlertTriangle size={15} className="text-dourado-escuro shrink-0 mt-0.5" />
                              <div className="leading-snug">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-dourado-escuro">
                                  Observação:
                                </span>
                                {pedido.observacao}
                              </div>
                            </div>
                          )}

                          {/* Lista de Itens com Checkbox Interativo */}
                          <div className="border-t border-b border-cinza-borda/40 py-2 space-y-1">
                            {pedido.itens?.map((item) => {
                              const checked = Boolean(itensChecados[`${pedido.id}-${item.id}`]);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleCheckItem(pedido.id, item.id)}
                                  className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    checked
                                      ? "text-cinza-texto/50 line-through bg-gray-50"
                                      : "text-verde-escuro hover:bg-fundo"
                                  }`}
                                >
                                  <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <span
                                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                                        checked
                                          ? "bg-verde-normal text-white border-verde-normal"
                                          : "border-cinza-borda bg-white text-verde-escuro"
                                      }`}
                                    >
                                      {checked ? <Check size={10} /> : item.quantidade}
                                    </span>
                                    <span>{item.produtoNome}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Botão Iniciar */}
                          <button
                            onClick={() => atualizarStatus(pedido.id, "preparando")}
                            className="w-full bg-verde-normal hover:bg-verde-destaque text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Iniciar Preparo →
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ══════════ COLUNA 2: EM PREPARO ══════════ */}
              <div
                className={`flex flex-col rounded-2xl border border-cinza-borda/80 bg-white shadow-xs overflow-hidden ${
                  abaAtivaMobile !== "preparando" ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="px-4 py-3.5 border-b border-cinza-borda/60 bg-fundo/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-verde-normal" />
                    <h2 className="font-extrabold text-verde-escuro text-sm sm:text-base">
                      Em Preparo
                    </h2>
                  </div>
                  <span className="bg-white text-verde-escuro font-bold text-xs px-2.5 py-0.5 rounded-full border border-cinza-borda">
                    {emPreparo.length}
                  </span>
                </div>

                <div className="p-3 sm:p-4 space-y-3 max-h-[calc(100vh-170px)] overflow-y-auto">
                  {emPreparo.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cinza-borda/80 bg-fundo/30">
                      <Flame size={32} className="mx-auto text-cinza-texto/40 mb-1.5" />
                      <p className="text-xs font-bold text-verde-escuro">Nada em preparo</p>
                      <p className="text-[11px] text-cinza-texto mt-0.5">Inicie novos pedidos da primeira coluna.</p>
                    </div>
                  ) : (
                    emPreparo.map((pedido) => {
                      const minutos = calcularMinutos(pedido.criadoEm);

                      return (
                        <div
                          key={pedido.id}
                          className="bg-white rounded-xl p-4 border border-cinza-borda/80 hover:border-cinza-borda hover:shadow-sm transition-all space-y-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            {renderCabecalhoPedido(pedido)}

                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-fundo text-verde-escuro border border-cinza-borda">
                              <ChefHat size={12} className="text-verde-normal" />
                              {minutos} min
                            </span>
                          </div>

                          {pedido.observacao && (
                            <div className="bg-[#FAF2EB] border border-[#E7D7C4] p-2.5 rounded-lg flex items-start gap-2 text-xs text-verde-escuro">
                              <AlertTriangle size={15} className="text-dourado-escuro shrink-0 mt-0.5" />
                              <div className="leading-snug">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-dourado-escuro">
                                  Observação:
                                </span>
                                {pedido.observacao}
                              </div>
                            </div>
                          )}

                          <div className="border-t border-b border-cinza-borda/40 py-2 space-y-1">
                            {pedido.itens?.map((item) => {
                              const checked = Boolean(itensChecados[`${pedido.id}-${item.id}`]);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleCheckItem(pedido.id, item.id)}
                                  className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    checked
                                      ? "text-cinza-texto/50 line-through bg-gray-50"
                                      : "text-verde-escuro hover:bg-fundo"
                                  }`}
                                >
                                  <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <span
                                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                                        checked
                                          ? "bg-verde-normal text-white border-verde-normal"
                                          : "border-cinza-borda bg-white text-verde-escuro"
                                      }`}
                                    >
                                      {checked ? <Check size={10} /> : item.quantidade}
                                    </span>
                                    <span>{item.produtoNome}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => atualizarStatus(pedido.id, "pronto")}
                            className="w-full bg-verde-normal hover:bg-verde-destaque text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={15} />
                            Marcar como Pronto ✓
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ══════════ COLUNA 3: PRONTOS PARA ENTREGA ══════════ */}
              <div
                className={`flex flex-col rounded-2xl border border-cinza-borda/80 bg-white shadow-xs overflow-hidden ${
                  abaAtivaMobile !== "pronto" ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="px-4 py-3.5 border-b border-cinza-borda/60 bg-fundo/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-verde-destaque" />
                    <h2 className="font-extrabold text-verde-escuro text-sm sm:text-base">
                      Prontos para Entrega
                    </h2>
                  </div>
                  <span className="bg-white text-verde-escuro font-bold text-xs px-2.5 py-0.5 rounded-full border border-cinza-borda">
                    {prontos.length}
                  </span>
                </div>

                <div className="p-3 sm:p-4 space-y-3 max-h-[calc(100vh-170px)] overflow-y-auto">
                  {prontos.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cinza-borda/80 bg-fundo/30">
                      <CheckCheck size={32} className="mx-auto text-cinza-texto/40 mb-1.5" />
                      <p className="text-xs font-bold text-verde-escuro">Nenhum pedido aguardando entrega</p>
                      <p className="text-[11px] text-cinza-texto mt-0.5">Assim que um prato estiver pronto, finalize por aqui.</p>
                    </div>
                  ) : (
                    prontos.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="bg-white rounded-xl p-4 border border-cinza-borda/80 hover:border-cinza-borda hover:shadow-sm transition-all space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          {renderCabecalhoPedido(pedido)}

                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-fundo text-verde-escuro border border-cinza-borda">
                            <CheckCircle size={12} className="text-verde-normal" /> Pronto
                          </span>
                        </div>

                        <div className="border-t border-b border-cinza-borda/40 py-2 space-y-1">
                          {pedido.itens?.map((item) => (
                            <p key={item.id} className="text-xs font-bold text-verde-escuro flex justify-between">
                              <span>
                                {item.quantidade}x {item.produtoNome}
                              </span>
                            </p>
                          ))}
                        </div>

                        <button
                          onClick={() => atualizarStatus(pedido.id, "entregue")}
                          className="w-full bg-verde-escuro hover:bg-verde-escuro/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCheck size={15} />
                          Finalizar Entrega
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <LogoRodape />
      </main>

      {/* ─── Navegação Mobile Fixa ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-verde-escuro border-t border-dourado/25 flex justify-around items-center p-2 safe-bottom z-30 shadow-lg">
        <Link href="/painel-pedidos" className="flex flex-col items-center gap-0.5 p-2 text-dourado">
          <ChefHat size={20} />
          <span className="text-[10px] font-bold">Cozinha</span>
        </Link>
        <Link href="/historico-pedidos" className="flex flex-col items-center gap-0.5 p-2 text-white/70 hover:text-white">
          <History size={20} />
          <span className="text-[10px] font-medium">Histórico</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-0.5 p-2 text-white/70 hover:text-white">
          <Pencil size={20} />
          <span className="text-[10px] font-medium">Cardápio</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5 p-2 text-white/70 hover:text-white">
          <Settings size={20} />
          <span className="text-[10px] font-medium">Config</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 p-2 text-white/70 hover:text-red-300">
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}