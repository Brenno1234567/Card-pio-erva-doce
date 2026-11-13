import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { Client } from "basic-ftp";
import { requireAdmin, isNextResponse } from "../../../lib/auth";

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const FORMATOS = {
  "image/jpeg": { extensao: ".jpg", validar: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extensao: ".png", validar: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extensao: ".webp", validar: (b: Buffer) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { extensao: ".gif", validar: (b: Buffer) => ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)) },
} as const;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isNextResponse(auth)) return auth;

  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const publicBaseUrl = process.env.FTP_PUBLIC_URL?.replace(/\/+$/, "");
  const ftpConfig = [
    host,
    user,
    password,
    publicBaseUrl,
    process.env.FTP_PORT,
    process.env.FTP_REMOTE_DIR,
    process.env.FTP_PUBLIC_PATH,
    process.env.FTP_SECURE,
  ];
  const usaFtp = Boolean(host && user && password && publicBaseUrl);
  if (ftpConfig.some(Boolean) && !usaFtp) {
    return NextResponse.json(
      { error: "A configuração FTP está incompleta. Confira FTP_HOST, FTP_USER, FTP_PASSWORD e FTP_PUBLIC_URL." },
      { status: 503 }
    );
  }
  let publicUrl: URL | null = null;
  if (usaFtp) {
    try {
      publicUrl = new URL(publicBaseUrl!);
      if (publicUrl.protocol !== "http:" && publicUrl.protocol !== "https:") throw new Error("Protocolo inválido");
    } catch {
      return NextResponse.json({ error: "FTP_PUBLIC_URL precisa ser uma URL HTTP ou HTTPS válida." }, { status: 503 });
    }
  }

  try {
    const data = await request.formData();
    const entry = data.get("file");
    if (!(entry instanceof File) || entry.size === 0) {
      return NextResponse.json({ error: "Selecione um arquivo de imagem." }, { status: 400 });
    }
    if (entry.size > TAMANHO_MAXIMO_BYTES) {
      return NextResponse.json({ error: "Imagem muito grande. O limite é 5 MB." }, { status: 400 });
    }

    const formato = FORMATOS[entry.type as keyof typeof FORMATOS];
    if (!formato) {
      return NextResponse.json({ error: "Formato inválido. Envie JPG, PNG, WEBP ou GIF." }, { status: 400 });
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    if (!formato.validar(buffer)) {
      return NextResponse.json({ error: "O conteúdo do arquivo não corresponde a uma imagem válida." }, { status: 400 });
    }

    const filename = `${randomUUID()}${formato.extensao}`;
    if (!usaFtp) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      return NextResponse.json({ success: true, url: `/api/uploads/${filename}`, storage: "local" });
    }

    const port = Number(process.env.FTP_PORT || 21);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json({ error: "FTP_PORT inválida." }, { status: 503 });
    }

    const remoteDir = process.env.FTP_REMOTE_DIR || "/uploads";
    const remoteFolderName = remoteDir.split("/").filter(Boolean).pop() || "uploads";
    const publicFolder = (process.env.FTP_PUBLIC_PATH || `/${remoteFolderName}`).replace(/^\/+|\/+$/g, "");
    const client = new Client(30_000);
    try {
      await client.access({
        host: host!,
        port,
        user: user!,
        password: password!,
        secure: process.env.FTP_SECURE === "true",
      });
      await client.ensureDir(remoteDir);
      await client.uploadFrom(Readable.from(buffer), filename);
    } finally {
      client.close();
    }

    const basePath = publicUrl!.pathname.replace(/\/+$/, "");
    const publicPath = basePath.toLowerCase().endsWith(`/${publicFolder.toLowerCase()}`)
      ? basePath
      : `${basePath}/${publicFolder}`;
    return NextResponse.json({ success: true, url: `${publicUrl!.origin}${publicPath}/${filename}`, storage: "ftp" });
  } catch (error) {
    console.error("Erro ao enviar imagem via FTP:", error);
    return NextResponse.json({ error: "Não foi possível enviar a imagem ao FTP." }, { status: 502 });
  }
}
