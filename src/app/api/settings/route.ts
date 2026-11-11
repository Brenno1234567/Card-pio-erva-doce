import { NextResponse } from "next/server";
import { db } from "../../../db";
import { configuracoes } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isNextResponse } from "../../../lib/auth";

export async function GET() {
  try {
    const [config] = await db.select().from(configuracoes).limit(1);
    return NextResponse.json({
      nomeRestaurante: config?.nomeRestaurante || "Erva Doce AscanI",
      statusLoja: config?.statusLoja ?? true,
      tempoPreparo: config?.tempoPreparo ?? "30-45",
      whatsapp: config?.whatsapp ?? "",
      whatsappEncomendas: config?.whatsappEncomendas ?? "",
      chavePix: config?.chavePix ?? "",
      tipoChavePix: config?.tipoChavePix ?? "Celular",
      taxaEntrega: Number(config?.taxaEntrega ?? 0),
    });
  } catch {
    return NextResponse.json({ error: "Erro interno ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    const [existente] = await db.select().from(configuracoes).limit(1);
    const valores = {
      nomeRestaurante: String(body.nomeRestaurante || "Erva Doce AscanI"),
      statusLoja: Boolean(body.statusLoja),
      tempoPreparo: String(body.tempoPreparo || "30-45"),
      whatsapp: body.whatsapp ? String(body.whatsapp).replace(/\D/g, "") : null,
      whatsappEncomendas: body.whatsappEncomendas ? String(body.whatsappEncomendas).replace(/\D/g, "") : null,
      chavePix: body.chavePix ? String(body.chavePix).trim() : null,
      tipoChavePix: body.tipoChavePix ? String(body.tipoChavePix).trim() : "Celular",
      taxaEntrega: typeof body.taxaEntrega === "number" ? body.taxaEntrega : parseFloat(String(body.taxaEntrega || 0).replace(",", ".")) || 0,
    };
    if (!existente) {
      await db.insert(configuracoes).values({ id: "config-principal", ...valores });
    } else {
      await db.update(configuracoes).set(valores).where(eq(configuracoes.id, existente.id));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno ao salvar configurações." }, { status: 500 });
  }
}
