import { NextResponse } from "next/server";
import { produtos } from "../../../db/schema";
import { requireAdmin, isNextResponse, getAuthRole } from "../../../lib/auth";
import { invalidarCacheProdutos, listarProdutosAtivosEmCache, listarTodosProdutosEmCache } from "../../../lib/produtos-cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const canal = searchParams.get("canal"); // "presencial" | "publico"
    const role = await getAuthRole();
    const lista = role === "admin" ? await listarTodosProdutosEmCache() : await listarProdutosAtivosEmCache();

    if (role === "admin" || !canal) {
      return NextResponse.json(lista);
    }

    const filtrados = lista.filter((p: any) => {
      const visibilidade = p.canalVisibilidade || "ambos";
      if (visibilidade === "ambos") return true;
      return visibilidade === canal;
    });

    return NextResponse.json(filtrados);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body?.nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const preco = Number(body.preco);
    if (isNaN(preco) || preco < 0) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }

    const precoDelivery = body.precoDelivery !== undefined && body.precoDelivery !== null && body.precoDelivery !== ""
      ? Number(body.precoDelivery)
      : null;

    const id = crypto.randomUUID();

    const { db } = await import("../../../db");
    await db.insert(produtos).values({
      id,
      nome: body.nome.trim(),
      descricao: String(body.descricao ?? "").trim(),
      preco,
      precoDelivery: isNaN(Number(precoDelivery)) ? null : precoDelivery,
      categoria: body.categoria || "Geral",
      canalVisibilidade: body.canalVisibilidade || "ambos",
      status: "Ativo",
      imagem: body.imagem?.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      tipoVariacao: body.tipoVariacao || null,
      opcoesVariacao: body.tipoVariacao ? String(body.opcoesVariacao ?? "").trim() || null : null,
      adicionais: body.adicionais ? String(body.adicionais).trim() || null : null,
    });
    invalidarCacheProdutos();

    return NextResponse.json({ success: true, id, message: "Produto cadastrado!" });
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    return NextResponse.json({ error: "Erro ao cadastrar produto" }, { status: 500 });
  }
}
