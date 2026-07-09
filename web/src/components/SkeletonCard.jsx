export default function SkeletonCard() {
  return (
    <article className="card skeleton">
      <div className="photo-wrap" />
      <div className="stub">
        <div className="stub-line w60" style={{ height: 13 }} />
        <div className="stub-line w90" />
        <div className="stub-line w60" />
        <span className="stub-caption">Claude rédige votre annonce…</span>
      </div>
    </article>
  );
}
