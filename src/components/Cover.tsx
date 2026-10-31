const COVERS: Record<string, [string, string]> = {
  불: ["#E3ECDD", "#2F5A2A"],
  데: ["#E8DDF0", "#4A2B6B"],
  작: ["#DCEBE0", "#1F5D4A"],
  소: ["#F5E0D3", "#8A3A12"],
  어: ["#DDE9F5", "#1D4E89"],
  모: ["#F7EBC8", "#7A5400"],
};

type Props = { ch: string; l?: boolean };

/** 책 표지 대용 컬러 블록 */
export default function Cover({ ch, l = false }: Props) {
  const [bg, fg] = COVERS[ch] ?? ["#E9ECEA", "#38443F"];
  return (
    <span
      className={`book-cover${l ? " is-large" : ""}`}
      style={{ background: bg, color: fg }}
    >
      {ch}
    </span>
  );
}
