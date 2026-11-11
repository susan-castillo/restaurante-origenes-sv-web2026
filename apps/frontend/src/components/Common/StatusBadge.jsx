
const estilos = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  secondary: "secondary",
};

export default function StatusBadge({
  text,
  variant = "secondary",
  className = "",
}) {
  const color = estilos[variant] || "secondary";

  return (
    <span
      className={`badge app-status app-status--${color}
        ${className}`}
    >
      {text}
    </span>
  );
}
