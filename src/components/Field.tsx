type Props = {
  label: string;
  ph?: string;
  val?: string;
  req?: boolean;
  opt?: boolean;
  typ?: string;
};

export default function Field({
  label,
  ph = "",
  val,
  req,
  opt,
  typ = "text",
}: Props) {
  return (
    <label className="fld">
      <span>
        {label}
        {req && <em>필수</em>}
        {opt && <em>선택</em>}
      </span>
      <input className="in" type={typ} placeholder={ph} defaultValue={val} />
    </label>
  );
}
