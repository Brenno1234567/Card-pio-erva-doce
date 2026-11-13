import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const TIPOS_IMAGEM: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const extension = path.extname(filename).toLowerCase();
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename) ||
    filename.includes("..") ||
    !TIPOS_IMAGEM[extension]
  ) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    const image = await readFile(filePath);
    return new NextResponse(image, {
      headers: {
        "Content-Type": TIPOS_IMAGEM[extension],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
    }
    console.error("Erro ao ler imagem do cardápio:", error);
    return NextResponse.json({ error: "Erro ao carregar imagem." }, { status: 500 });
  }
}
