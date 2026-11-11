import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin, isNextResponse } from "../../../lib/auth";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie uma imagem JPEG, PNG, WEBP ou GIF." },
        { status: 400 }
      );
    }

    if (file.size > TAMANHO_MAXIMO_BYTES) {
      return NextResponse.json(
        { error: "Imagem muito grande. Tamanho máximo permitido: 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Garante que o nome do arquivo seja único para evitar substituições
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
    const filename = `${uniqueSuffix}-${sanitizedFileName}`;

    // Define o caminho para a pasta public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Cria a pasta public/uploads automaticamente se ela não existir
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Erro ao criar diretório de uploads:", err);
    }

    // Salva o arquivo localmente
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Retorna a URL pública local (ex: /uploads/123456789-foto.jpg)
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Erro ao salvar a imagem localmente:", error);
    return NextResponse.json({ error: "Erro ao salvar a imagem." }, { status: 500 });
  }
}