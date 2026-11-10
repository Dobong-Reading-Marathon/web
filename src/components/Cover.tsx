import { useState } from "react";

const COVERS: Record<string, [string, string]> = {
  불: ["#E3ECDD", "#2F5A2A"],
  데: ["#E8DDF0", "#4A2B6B"],
  작: ["#DCEBE0", "#1F5D4A"],
  소: ["#F5E0D3", "#8A3A12"],
  어: ["#DDE9F5", "#1D4E89"],
  모: ["#F7EBC8", "#7A5400"],
};
{/*변수값으로 변경, 랜덤으로 색 넣기*/}

type Props = {
  ch: string;
  l?: boolean;
  /** 표지 이미지 주소. 없거나 불러오지 못하면 색 블록 + 글자로 대체 */
  src?: string | null;
  className?: string;
  /** true면 색을 인라인으로 넣지 않고 CSS 클래스에 맡긴다 */
  colorless?: boolean;
};

/** 책 표지. 이미지가 있으면 이미지, 없으면 색 블록 + 글자 한 자 */
export default function Cover({ ch, l = false, src, className = "", colorless = false }: Props) {
  // 로딩에 실패한 주소를 기억한다. 주소가 바뀌면 다시 시도한다
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc !== null && failedSrc === src;

  const [bg, fg] = COVERS[ch] ?? ["#E9ECEA", "#38443F"];
  const showImage = Boolean(src) && !failed;
  const classes = `book-cover${l ? " is-large" : ""}${showImage ? " has-image" : ""}${className ? ` ${className}` : ""}`;
  return (
    <span className={classes} style={colorless ? undefined : { background: bg, color: fg }}>
      {showImage ? (
        <img src={src ?? undefined} alt="" loading="lazy" onError={() => setFailedSrc(src ?? null)} />
      ) : (
        ch
      )}
    </span>
  );
}
