
export default function Tabs({
  options = [],
  value,
  onChange,
  variant = "tabs",
  className = "",
}) {
  return (
    <div
      className={`app-tabs app-tabs--${variant}
        d-flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Opciones de navegación o filtro"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`btn app-tab ${
            value === option.value ? "active" : ""
          }`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
