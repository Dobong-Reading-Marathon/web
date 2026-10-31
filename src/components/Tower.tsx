type Props = { w?: number };

export default function Tower({ w = 420 }: Props) {
  const stripes = Array.from({ length: 10 }, (_, i) => (
    <rect
      key={i}
      x={168}
      y={150 + i * 26}
      width={164}
      height={3}
      fill="#7DB79C"
      fillOpacity={0.8}
    />
  ));
  const windows = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 4 }, (_, c) => (
      <rect
        key={`${r}-${c}`}
        x={262 + c * 34}
        y={86 + r * 34}
        width={20}
        height={20}
        rx={3}
        fill="#2F7D5F"
        fillOpacity={0.55}
      />
    )),
  );
  return (
    <svg
      className="art"
      viewBox="0 0 520 420"
      fill="none"
      aria-hidden="true"
      style={{ width: w }}
    >
      <path d="M250 56L420 106V420H250Z" fill="#1B4A3A" />
      {windows}
      <path d="M150 130L330 78V420H150Z" fill="#fff" fillOpacity={0.94} />
      {stripes}
      <path d="M150 130L330 78" stroke="#BFE0CF" strokeWidth="3" />
      <rect x="60" y="300" width="110" height="120" rx="6" fill="#BFE0CF" />
      {[76, 108].map((x) =>
        [318, 352].map((y) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="22"
            height="22"
            rx="3"
            fill="#fff"
            fillOpacity=".8"
          />
        )),
      )}
    </svg>
  );
}
