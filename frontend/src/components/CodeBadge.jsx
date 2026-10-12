export function CodeBadge({ code, children }) {
  return <span className="ce-badge ce-badge-code">{children || code}</span>;
}
