import Image from "next/image";

interface PlayerPortraitProps {
  name: string;
  src?: string | null;
  size?: "sm" | "lg";
}

const SIZES = {
  sm: { box: "h-10 w-10", pixels: 40, text: "text-xs" },
  lg: { box: "h-40 w-40 sm:h-44 sm:w-44", pixels: 176, text: "text-3xl" },
};

function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function PlayerPortrait({ name, src, size = "sm" }: PlayerPortraitProps) {
  const config = SIZES[size];

  return (
    <span
      className={`${config.box} relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-panel-2 text-ink-faint shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]`}
    >
      {src ? (
        <Image
          src={src}
          alt={`Portrait of ${name}`}
          width={config.pixels}
          height={config.pixels}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={`stat-num font-semibold ${config.text}`} aria-hidden="true">
          {initialsFor(name)}
        </span>
      )}
    </span>
  );
}
