
export default function Card({
  tag: Component = "div",
  title,
  subtitle,
  children,
  footer,
  className = "",
  onClick,
  ...props
}) {
  return (
    <Component
      className={`card app-card h-100 ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="card-body">
        {title && (
          <h3 className="card-title">{title}</h3>
        )}

        {subtitle && (
          <p className="card-subtitle">{subtitle}</p>
        )}

        {children}
      </div>

      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </Component>
  );
}
