import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="#top" className="logo" aria-label="Syncion Tech home">
      <Image src="/Syncion Logo-selection.png" alt="" width={120} height={74} priority />
      <span className={light ? "text-white" : "text-ink"}>Syncion</span>
    </Link>
  );
}
