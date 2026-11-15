export default function Avatar({ src, name = '?', size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  return src ? (
    <img src={src} alt={name} style={style} className="shrink-0 rounded-full border border-line object-cover" />
  ) : (
    <span style={style} aria-label={name} className="grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
