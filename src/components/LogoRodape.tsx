import Image from "next/image";

/**
 * Logo da Erva Doce como marca d'água ocupando a tela inteira
 * (painel da cozinha e páginas do admin).
 * - fixed, começando abaixo do cabeçalho (top-20) para a logo aparecer inteira
 * - pointer-events-none: não atrapalha cliques
 * - sem blend: a logo dourada aparece clara sobre o fundo verde
 * - opacity: ajuste aqui se quiser a logo mais forte ou mais fraca
 */
export default function LogoRodape() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 top-20 z-[1] select-none opacity-[0.32]"
    >
      <Image
        src="/logo-erva-doce-transparent.png"
        alt=""
        fill
        sizes="100vw"
        draggable={false}
        className="object-contain p-2"
      />
    </div>
  );
}
