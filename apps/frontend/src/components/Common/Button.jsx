
export default function Button({
  tag: Component = "button",
  text,
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  return (
    <Component
      type={Component === "button" ? type : undefined}
      className={`btn btn-${variant} btn-${size} app-button ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Cargando..." : children ?? text}
    </Component>
  );
}
