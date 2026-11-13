import { NextResponse } from "next/server";
import { produtos } from "../../../db/schema";
import { requireAdmin, isNextResponse, getAuthRole } from "../../../lib/auth";
import { invalidarCacheProdutos, listarProdutosAtivosEmCache, listarTodosProdutosEmCache } from "../../../lib/produtos-cache";

function comUrlImagemServivel(produto: any) {
  if (typeof produto.imagem === "string" && /^\/uploads\/[^/]+$/.test(produto.imagem)) {
    return { ...produto, imagem: produto.imagem.replace(/^\/uploads\//, "/api/uploads/") };
  }
  return produto;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const canal = searchParams.get("canal"); // "presencial" | "publico"
    const role = await getAuthRole();

    // A tela administrativa consulta sem canal para gerenciar todos os itens.
    // Quando há um canal, a resposta deve respeitar visibilidade e status mesmo
    // se a requisição vier de uma sessão de administrador.
    if (role === "admin" && !canal) {
      const lista = await listarTodosProdutosEmCache();
      return NextResponse.json(lista.map(comUrlImagemServivel));
    }

    const lista = await listarProdutosAtivosEmCache();

    if (!canal) {
      return NextResponse.json(lista.map(comUrlImagemServivel));
    }

    const filtrados = lista.filter((p: any) => {
      const visibilidade = p.canalVisibilidade || "ambos";
      if (visibilidade === "ambos") return true;
      return visibilidade === canal;
    });

    return NextResponse.json(filtrados.map(comUrlImagemServivel));
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
    const imagem = typeof body.imagem === "string" ? body.imagem.trim() : "";
    const uploadLocalValido = /^\/api\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(imagem);
    if (imagem && !/^https?:\/\//i.test(imagem) && !uploadLocalValido) {
      return NextResponse.json({ error: "Informe um link HTTP(S) ou uma imagem enviada pelo cardápio." }, { status: 400 });
    }

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
      imagem: imagem || null,
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
