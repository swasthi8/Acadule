import Image from "next/image";

export function BrandLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <Image
      src="/trinovi-logo.png"
      alt="Trinovi"
      width={compact ? 64 : 200}
      height={compact ? 64 : 72}
      priority
      className={`${compact ? "h-14 w-14 sm:h-16 sm:w-16" : "h-[72px] w-[200px]"} object-contain ${className}`}
    />
  );
}