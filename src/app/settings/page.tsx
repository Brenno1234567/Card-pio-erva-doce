"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LogoRodape from "../../components/LogoRodape";
import { ArrowLeft, Clock, MessageCircle, Save, Settings, QrCode, Bike, Store } from "lucide-react";

export default function AdminSettingsPage() {
  const [nomeRestaurante, setNomeRestaurante] = useState("Erva Doce AscanI");
  const [statusLoja, setStatusLoja] = useState(true);
  const [tempoPreparo, setTempoPreparo] = useState("30-45");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappEncomendas, setWhatsappEncomendas] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("Celular");
  const [taxaEntrega, setTaxaEntrega] = useState("0.00");
  const [salvo, setSalvo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setNomeRestaurante(data.nomeRestaurante || "Erva Doce AscanI");
        setStatusLoja(data.statusLoja ?? true);
        setTempoPreparo(data.tempoPreparo || "30-45");
        setWhatsapp(data.whatsapp || "");
        setWhatsappEncomendas(data.whatsappEncomendas || "");
        setChavePix(data.chavePix || "");
        setTipoChavePix(data.tipoChavePix || "Celular");
        setTaxaEntrega(Number(data.taxaEntrega ?? 0).toFixed(2));
      })
      .catch(() => alert("Não foi possível carregar as configurações."))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeRestaurante,
        statusLoja,
        tempoPreparo,
        whatsapp,
        whatsappEncomendas,
        chavePix,
        tipoChavePix,
        taxaEntrega: parseFloat(taxaEntrega.replace(",", ".")) || 0,
      }),
    });
    if (!res.ok) return alert("Erro ao salvar configurações.");
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  }

  if (carregando)
    return (
      <main className="min-h-screen bg-fundo-verde flex items-center justify-center text-white font-bold">
        Carregando configurações...
      </main>
    );

  return (
    <div className="min-h-screen bg-fundo-verde flex flex-col">
      <header className="bg-verde-escuro text-white p-4 md:px-8 flex items-center justify-between gap-3 shadow-md border-b-2 border-dourado/40">
        <div className="flex items-center gap-3">
          <Link href="/painel-pedidos" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors ring-1 ring-dourado/30">
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-dourado">Erva Doce</p>
            <h1 className="text-base sm:text-xl font-bold flex items-center gap-2">
              <Settings size={19} className="text-dourado" /> Configurações
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <form onSubmit={salvar} className="space-y-6">
          {/* Status da loja */}
          <section className="bg-white p-6 rounded-2xl border border-cinza-borda/70 shadow-sm">
            <h2 className="font-bold text-verde-escuro text-lg mb-1.5">Operação do estabelecimento</h2>
            <p className="text-xs text-cinza-texto mb-5">Controle a disponibilidade para novos pedidos.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStatusLoja(!statusLoja)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  statusLoja ? "bg-verde-normal" : "bg-red-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    statusLoja ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm font-bold ${statusLoja ? "text-verde-destaque" : "text-red-500"}`}>
                {statusLoja ? "Loja aberta (aceitando pedidos)" : "Loja fechada"}
              </span>
            </div>
          </section>

          {/* Nome da Loja e Tempo de preparo */}
          <section className="bg-white p-6 rounded-2xl border border-cinza-borda/70 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-verde-normal/10 text-verde-normal rounded-xl ring-1 ring-dourado/25">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-bold text-verde-escuro text-lg">Identificação e Prazos</h2>
                <p className="text-xs text-cinza-texto">Informações exibidas no cabeçalho e mensagens</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={nomeRestaurante}
                  onChange={(e) => setNomeRestaurante(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  Tempo médio de preparo (minutos)
                </label>
                <input
                  type="text"
                  value={tempoPreparo}
                  onChange={(e) => setTempoPreparo(e.target.value)}
                  placeholder="Ex: 30-45"
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                  required
                />
              </div>
            </div>
          </section>

          {/* WhatsApp de Encomendas & Delivery */}
          <section className="bg-white p-6 rounded-2xl border border-cinza-borda/70 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-green-100 text-green-600 rounded-xl ring-1 ring-green-200">
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="font-bold text-verde-escuro text-lg">WhatsApp para Pedidos & Encomendas</h2>
                <p className="text-xs text-cinza-texto">Números que receberão os pedidos montados pelos clientes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  WhatsApp de Encomendas (Bolos / Festas)
                </label>
                <input
                  type="tel"
                  value={whatsappEncomendas}
                  onChange={(e) => setWhatsappEncomendas(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 5514998156360"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                />
                <p className="text-[11px] text-cinza-texto mt-1">DDI + DDD + Número (ex: 5514999999999)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  WhatsApp Geral / Delivery (opcional)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 5514998156360"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                />
                <p className="text-[11px] text-cinza-texto mt-1">Caso vazio, usa o número de encomendas</p>
              </div>
            </div>
          </section>

          {/* Pagamentos Pix e Taxa de Entrega */}
          <section className="bg-white p-6 rounded-2xl border border-cinza-borda/70 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-dourado/20 text-dourado-escuro rounded-xl ring-1 ring-dourado/30">
                <QrCode size={20} />
              </div>
              <div>
                <h2 className="font-bold text-verde-escuro text-lg">Pix e Taxa de Entrega</h2>
                <p className="text-xs text-cinza-texto">Dados financeiros exibidos no fechamento do pedido</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  Tipo de Chave Pix
                </label>
                <select
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium bg-white"
                >
                  <option value="Celular">Celular</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Aleatória">Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  Chave Pix da Loja
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder="Ex: 14998156360"
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-verde-escuro mb-1.5">
                  Taxa de Entrega Padrão (R$)
                </label>
                <input
                  type="text"
                  value={taxaEntrega}
                  onChange={(e) => setTaxaEntrega(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-borda text-sm focus:outline-none focus:border-verde-normal text-verde-escuro font-medium"
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-4">
            {salvo && <span className="text-xs font-bold text-dourado-escuro">✓ Configurações salvas com sucesso!</span>}
            <button
              type="submit"
              className="flex items-center gap-2 bg-verde-normal hover:bg-verde-destaque text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save size={17} /> Salvar alterações
            </button>
          </div>
        </form>
      </main>

      <LogoRodape />
    </div>
  );
}