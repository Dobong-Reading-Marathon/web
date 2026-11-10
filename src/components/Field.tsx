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
    <label className="form-field">
      <span>
        {label}
        {req && <em>필수</em>}
        {opt && <em>선택</em>}
      </span>
      <input className="text-input" type={typ} placeholder={ph} defaultValue={val} />
    </label>
  );
}
