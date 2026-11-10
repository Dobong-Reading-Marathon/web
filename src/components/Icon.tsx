const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  bell: "M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4",
  plus: "M12 5v14M5 12h14",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4",
  check: "M5 12l5 5 9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  users:
    "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20a7 7 0 0114 0M17 4a3.5 3.5 0 010 7M18 14a7 7 0 013.5 6",
  chart: "M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9",
  clip: "M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4",
  award: "M12 14a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5",
  printer: "M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  camera: "M4 8h4l2-3h4l2 3h4v12H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  barcode: "M4 5v14M7 5v14M11 5v14M14 5v14M17 5v14M20 5v14",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  trophy:
    "M8 4h8v6a4 4 0 01-8 0zM8 6H4v2a3 3 0 003 3M16 6h4v2a3 3 0 01-3 3M12 14v4M8 20h8",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2v2",
  menu: "M4 7h16M4 12h16M4 17h16",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 018 0v3",
  mail: "M3 6h18v13H3zM3 7l9 7 9-7",
  copy: "M8 8h11v12H8zM5 16V4h11",
  trash: "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  x: "M6 6l12 12M18 6L6 18",
  chr: "M9 5l7 7-7 7",
  chl: "M15 5l-7 7 7 7",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7h-7zM13 13h7v7h-7z",
  send: "M4 12l16-8-6 16-3-7z",
  sliders: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6",
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  n: IconName;
  s?: number;
  sw?: number;
};

export default function Icon({ n, s = 20, sw = 1.8 }: Props) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <path d={ICONS[n]} />
    </svg>
  );
}
