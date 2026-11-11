"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ItemCento {
  id: string;
  nome: string;
  precoCento: number;
  quantidade: number; // múltiplos de 50
}

interface ItemKg {
  id: string;
  nome: string;
  precoKg: number;
  gramas: number;
}

interface ItemBolo {
  id: string;
  nome: string;
  massa: "Branca" | "Chocolate";
  preco: number;
  selecionado: boolean;
}

// ─── Dados do cardápio ────────────────────────────────────────────────────────
const SALGADINHOS_INICIAL: ItemCento[] = [
  { id: "s1", nome: "Coxinha", precoCento: 95, quantidade: 0 },
  { id: "s2", nome: "Risólis", precoCento: 95, quantidade: 0 },
  { id: "s3", nome: "Bolinha de Queijo", precoCento: 95, quantidade: 0 },
  { id: "s4", nome: "Esfirrinha de Carne", precoCento: 95, quantidade: 0 },
  { id: "s5", nome: "Esfirrinha de Frango", precoCento: 95, quantidade: 0 },
  { id: "s6", nome: "Esfirrinha de Calabresa", precoCento: 95, quantidade: 0 },
  { id: "s7", nome: "Salsichinha", precoCento: 95, quantidade: 0 },
  { id: "s8", nome: "Enroladinho de Presunto e Queijo", precoCento: 95, quantidade: 0 },
  { id: "s9", nome: "Empadinhas de Frango", precoCento: 105, quantidade: 0 },
  { id: "s10", nome: "Empadinhas de Palmito", precoCento: 105, quantidade: 0 },
  { id: "s11", nome: "Empadinhas de Calabresa com Requeijão", precoCento: 105, quantidade: 0 },
  { id: "s12", nome: "Mini Cachorro Quente", precoCento: 105, quantidade: 0 },
  { id: "s13", nome: "Mini Quiches", precoCento: 105, quantidade: 0 },
  { id: "s14", nome: "Quiches", precoCento: 105, quantidade: 0 },
  { id: "s15", nome: "Kibe", precoCento: 95, quantidade: 0 },
  { id: "s16", nome: "Pão de Batata com Patê", precoCento: 159, quantidade: 0 },
];

const DOCINHOS_INICIAL: ItemCento[] = [
  { id: "d1", nome: "Brigadeiro", precoCento: 110, quantidade: 0 },
  { id: "d2", nome: "Bicho de Pé", precoCento: 110, quantidade: 0 },
  { id: "d3", nome: "Beijinho", precoCento: 110, quantidade: 0 },
  { id: "d4", nome: "Casadinho", precoCento: 110, quantidade: 0 },
  { id: "d5", nome: "Churros", precoCento: 110, quantidade: 0 },
  { id: "d6", nome: "Bombom de Morango", precoCento: 110, quantidade: 0 },
];

const TORTAS_INICIAL: ItemKg[] = [
  { id: "t1", nome: "Torta Doce - Sabor Limão", precoKg: 80, gramas: 0 },
  { id: "t2", nome: "Torta Doce - Sabor Morango", precoKg: 80, gramas: 0 },
  { id: "t3", nome: "Pudim de Leite Condensado", precoKg: 45, gramas: 0 },
  { id: "t4", nome: "Mini Bombons", precoKg: 80, gramas: 0 },
];

const BOLOS_INICIAL: ItemBolo[] = [
  { id: "bb1", nome: "Ninho com doce de leite cozido", massa: "Branca", preco: 70, selecionado: false },
  { id: "bb2", nome: "Lua de mel e Ninho com cerejas", massa: "Branca", preco: 72, selecionado: false },
  { id: "bb3", nome: "Ninho com sonho de valsa e brigadeiro", massa: "Branca", preco: 74, selecionado: false },
  { id: "bb4", nome: "Ninho com ouro branco e lua de mel", massa: "Branca", preco: 74, selecionado: false },
  { id: "bb5", nome: "Creme de Abacaxi e Leite Ninho", massa: "Branca", preco: 70, selecionado: false },
  { id: "bb6", nome: "Creme de Abacaxi e Doce de Leite cozido", massa: "Branca", preco: 70, selecionado: false },
  { id: "bb7", nome: "Creme de Abacaxi e recheio de coco", massa: "Branca", preco: 70, selecionado: false },
  { id: "bb8", nome: "Creme com ameixas e Doce de Leite cozido", massa: "Branca", preco: 72, selecionado: false },
  { id: "bb9", nome: "Creme com pêssegos e Leite condensado cozido", massa: "Branca", preco: 70, selecionado: false },
  { id: "bb10", nome: "Doce de Leite cozido com ameixas, prestígio e Marshmallow", massa: "Branca", preco: 72, selecionado: false },
  { id: "bb11", nome: "Lua de Mel com Morangos e Leite Ninho", massa: "Branca", preco: 72, selecionado: false },
  { id: "bb12", nome: "Creme com morangos e Nozes", massa: "Branca", preco: 74, selecionado: false },
  { id: "bb13", nome: "Creme com Amendoim e Leite Condensado cozido", massa: "Branca", preco: 70, selecionado: false },
  { id: "bc1", nome: "Alpino", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc2", nome: "Doce de Leite cozido", massa: "Chocolate", preco: 70, selecionado: false },
  { id: "bc3", nome: "Cappuccino e Brigadeiro", massa: "Chocolate", preco: 70, selecionado: false },
  { id: "bc4", nome: "Alpino e mousse de Chocolate Picado", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc5", nome: "Brigadeiro e Leite Ninho", massa: "Chocolate", preco: 70, selecionado: false },
  { id: "bc6", nome: "Brigadeiro, Leite Ninho com Cerejas", massa: "Chocolate", preco: 72, selecionado: false },
  { id: "bc7", nome: "Brigadeiro e Prestígio", massa: "Chocolate", preco: 70, selecionado: false },
  { id: "bc8", nome: "Brigadeiro, Lua de Mel com Morangos", massa: "Chocolate", preco: 72, selecionado: false },
  { id: "bc9", nome: "Lua de Mel com Morangos e Leite Ninho", massa: "Chocolate", preco: 72, selecionado: false },
  { id: "bc10", nome: "Brigadeiro e Mousse de Maracujá", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc11", nome: "Brigadeiro, Mousse de Chocolate trufado com chocolate picado", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc12", nome: "Chocolate trufado preto e trufado branco", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc13", nome: "Chocolate Alpino e Leite Ninho", massa: "Chocolate", preco: 74, selecionado: false },
  { id: "bc14", nome: "Chocolate Kit Kat", massa: "Chocolate", preco: 72, selecionado: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EncomendasPage() {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [salgadinhos, setSalgadinhos] = useState<ItemCento[]>(SALGADINHOS_INICIAL);
  const [docinhos, setDocinhos] = useState<ItemCento[]>(DOCINHOS_INICIAL);
  const [tortas, setTortas] = useState<ItemKg[]>(TORTAS_INICIAL);
  const [bolos, setBolos] = useState<ItemBolo[]>(BOLOS_INICIAL);

  // Busca WhatsApp das configurações
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setWhatsapp(d.whatsappEncomendas || null))
      .catch(() => setWhatsapp(null))
      .finally(() => setCarregando(false));
  }, []);

  // ── Cálculos de total ──────────────────────────────────────────────────────
  const totalSalg = salgadinhos.reduce(
    (acc, i) => acc + (i.quantidade / 100) * i.precoCento, 0
  );
  const totalDoc = docinhos.reduce(
    (acc, i) => acc + (i.quantidade / 100) * i.precoCento, 0
  );
  const totalTortas = tortas.reduce(
    (acc, i) => acc + (i.gramas / 1000) * i.precoKg, 0
  );
  const totalBolos = bolos
    .filter((b) => b.selecionado)
    .reduce((acc, b) => acc + b.preco, 0);
  const total = totalSalg + totalDoc + totalTortas + totalBolos;

  // ── Helpers de estado ──────────────────────────────────────────────────────
  function setCentoQtd(
    list: ItemCento[],
    setList: (v: ItemCento[]) => void,
    id: string,
    delta: number
  ) {
    setList(
      list.map((i) =>
        i.id === id
          ? { ...i, quantidade: Math.max(0, i.quantidade + delta * 50) }
          : i
      )
    );
  }

  function setGramas(id: string, val: number) {
    setTortas(tortas.map((t) => (t.id === id ? { ...t, gramas: Math.max(0, val) } : t)));
  }

  function toggleBolo(id: string) {
    setBolos(bolos.map((b) => (b.id === id ? { ...b, selecionado: !b.selecionado } : b)));
  }

  // ── Envio via WhatsApp ─────────────────────────────────────────────────────
  function enviar() {
    if (!nome.trim()) return alert("Por favor, informe seu nome.");
    if (!data) return alert("Por favor, informe a data de retirada.");
    if (total === 0) return alert("Selecione pelo menos um item.");

    const linhas: string[] = [
      "*Pedido de Encomenda - Erva Doce Ascani*",
      "",
      `*Cliente:* ${nome.trim()}`,
      `*Retirada:* ${new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}`,
    ];

    const salgsAtivos = salgadinhos.filter((i) => i.quantidade > 0);
    if (salgsAtivos.length) {
      linhas.push("", "*Salgadinhos:*");
      salgsAtivos.forEach((i) => {
        const subtotal = (i.quantidade / 100) * i.precoCento;
        linhas.push(`  - ${i.nome} (${i.quantidade} unid.): ${brl(subtotal)}`);
      });
    }

    const docsAtivos = docinhos.filter((i) => i.quantidade > 0);
    if (docsAtivos.length) {
      linhas.push("", "*Docinhos:*");
      docsAtivos.forEach((i) => {
        const subtotal = (i.quantidade / 100) * i.precoCento;
        linhas.push(`  - ${i.nome} (${i.quantidade} unid.): ${brl(subtotal)}`);
      });
    }

    const tortasAtivas = tortas.filter((i) => i.gramas > 0);
    if (tortasAtivas.length) {
      linhas.push("", "*Tortas e Doces (por kg):*");
      tortasAtivas.forEach((i) => {
        const subtotal = (i.gramas / 1000) * i.precoKg;
        linhas.push(`  - ${i.nome} (${i.gramas}g): ${brl(subtotal)}`);
      });
    }

    const bolosSel = bolos.filter((b) => b.selecionado);
    if (bolosSel.length) {
      linhas.push("", "*Bolos:*");
      bolosSel.forEach((b) => {
        linhas.push(`  - [Massa ${b.massa}] ${b.nome}: ${brl(b.preco)}`);
      });
    }

    if (observacao.trim()) {
      linhas.push("", `*Observação:* ${observacao.trim()}`);
    }

    linhas.push("", `*Total estimado: ${brl(total)}*`, "", "*Valores sujeitos a confirmação.*");

    const msg = encodeURIComponent(linhas.join("\n"));
    window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
  }

  // ── Componente Stepper ─────────────────────────────────────────────────────
  function StepperCento({
    item,
    list,
    setList,
  }: {
    item: ItemCento;
    list: ItemCento[];
    setList: (v: ItemCento[]) => void;
  }) {
    return (
      <div className="flex items-center justify-between bg-white border border-[#E7D7C4] rounded-2xl p-3 shadow-sm">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#5C3A22] text-sm leading-tight">{item.nome}</p>
          <p className="text-xs text-[#4A3B31]/60 mt-0.5">{brl(item.precoCento)}/cento</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {item.quantidade > 0 && (
            <span className="text-xs font-bold text-[#527A49]">
              {brl((item.quantidade / 100) * item.precoCento)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setCentoQtd(list, setList, item.id, -1)}
            className="w-8 h-8 rounded-full bg-[#E7D7C4] text-[#5C3A22] font-bold text-lg flex items-center justify-center hover:bg-[#C9A24B]/30 transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-[#527A49] text-sm">
            {item.quantidade === 0 ? "—" : item.quantidade}
          </span>
          <button
            type="button"
            onClick={() => setCentoQtd(list, setList, item.id, 1)}
            className="w-8 h-8 rounded-full bg-[#527A49] text-white font-bold text-lg flex items-center justify-center hover:bg-[#3F6537] transition-colors"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FCF8F2] flex items-center justify-center">
        <p className="text-[#527A49] font-bold animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F2] pb-32">
      {/* Header */}
      <header className="bg-[#5C3A22] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/cardapio" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            ←
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#C9A24B] font-bold">Erva Doce Ascani</p>
            <h1 className="text-lg font-bold">Encomendas</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <p className="text-sm text-[#4A3B31]/70 text-center">
          Monte seu pedido e envie direto pelo WhatsApp. Simples assim!
        </p>

        {/* Dados do cliente */}
        <section className="bg-white rounded-2xl border border-[#E7D7C4] p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-[#5C3A22] text-base">Seus dados</h2>
          <div>
            <label className="block text-xs font-semibold text-[#5C3A22] mb-1.5">Seu nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7D7C4] text-sm focus:outline-none focus:border-[#527A49] focus:ring-2 focus:ring-[#527A49]/15 text-[#5C3A22]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5C3A22] mb-1.5">Data de retirada *</label>
            <input
              type="date"
              value={data}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7D7C4] text-sm focus:outline-none focus:border-[#527A49] focus:ring-2 focus:ring-[#527A49]/15 text-[#5C3A22]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5C3A22] mb-1.5">Observações (opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Alguma preferência ou detalhe especial?"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7D7C4] text-sm focus:outline-none focus:border-[#527A49] focus:ring-2 focus:ring-[#527A49]/15 text-[#5C3A22] resize-none"
            />
          </div>
        </section>

        {/* Salgadinhos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#5C3A22] text-base">Salgadinhos</h2>
            <span className="text-xs text-[#4A3B31]/50 bg-[#E7D7C4]/50 px-2 py-1 rounded-full">preço por cento</span>
          </div>
          {salgadinhos.map((item) => (
            <StepperCento key={item.id} item={item} list={salgadinhos} setList={setSalgadinhos} />
          ))}
        </section>

        {/* Docinhos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#5C3A22] text-base">Docinhos</h2>
            <span className="text-xs text-[#4A3B31]/50 bg-[#E7D7C4]/50 px-2 py-1 rounded-full">preço por cento</span>
          </div>
          {docinhos.map((item) => (
            <StepperCento key={item.id} item={item} list={docinhos} setList={setDocinhos} />
          ))}
        </section>

        {/* Tortas e doces por kg */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#5C3A22] text-base">Tortas & Doces</h2>
            <span className="text-xs text-[#4A3B31]/50 bg-[#E7D7C4]/50 px-2 py-1 rounded-full">preço por kg</span>
          </div>
          {tortas.map((item) => (
            <div key={item.id} className="bg-white border border-[#E7D7C4] rounded-2xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-[#5C3A22] text-sm">{item.nome}</p>
                  <p className="text-xs text-[#4A3B31]/60">{brl(item.precoKg)}/kg</p>
                </div>
                {item.gramas > 0 && (
                  <span className="text-xs font-bold text-[#527A49] shrink-0">
                    {brl((item.gramas / 1000) * item.precoKg)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={item.gramas || ""}
                  onChange={(e) => setGramas(item.id, Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-3 py-2 rounded-xl border border-[#E7D7C4] text-sm text-[#5C3A22] focus:outline-none focus:border-[#527A49] text-center font-bold"
                />
                <span className="text-xs text-[#4A3B31]/60">gramas (mín. 500g)</span>
              </div>
            </div>
          ))}
        </section>

        {/* Bolos - Massa Branca */}
        <section className="space-y-2">
          <h2 className="font-bold text-[#5C3A22] text-base">Bolos — Massa Branca</h2>
          <div className="grid gap-2">
            {bolos
              .filter((b) => b.massa === "Branca")
              .map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBolo(b.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all shadow-sm ${
                    b.selecionado
                      ? "bg-[#527A49] border-[#3F6537] text-white"
                      : "bg-white border-[#E7D7C4] text-[#5C3A22]"
                  }`}
                >
                  <span className="text-sm font-medium">{b.nome}</span>
                  <span className={`text-sm font-bold shrink-0 ml-2 ${b.selecionado ? "text-white" : "text-[#527A49]"}`}>
                    {brl(b.preco)}
                  </span>
                </button>
              ))}
          </div>
        </section>

        {/* Bolos - Massa Chocolate */}
        <section className="space-y-2">
          <h2 className="font-bold text-[#5C3A22] text-base">Bolos — Massa Chocolate</h2>
          <div className="grid gap-2">
            {bolos
              .filter((b) => b.massa === "Chocolate")
              .map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBolo(b.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all shadow-sm ${
                    b.selecionado
                      ? "bg-[#5C3A22] border-[#3d2410] text-white"
                      : "bg-white border-[#E7D7C4] text-[#5C3A22]"
                  }`}
                >
                  <span className="text-sm font-medium">{b.nome}</span>
                  <span className={`text-sm font-bold shrink-0 ml-2 ${b.selecionado ? "text-[#C9A24B]" : "text-[#527A49]"}`}>
                    {brl(b.preco)}
                  </span>
                </button>
              ))}
          </div>
        </section>
      </main>

      {/* Rodapé flutuante */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E7D7C4] shadow-xl px-4 py-3 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#4A3B31]/60">Total estimado</span>
            <span className="text-xl font-bold text-[#527A49]">{brl(total)}</span>
          </div>
          {!whatsapp ? (
            <p className="text-center text-sm text-red-500 font-medium py-2">
              Pedidos via WhatsApp indisponíveis no momento. Entre em contato por telefone.
            </p>
          ) : (
            <button
              type="button"
              onClick={enviar}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-base"
            >
              Enviar pedido pelo WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
