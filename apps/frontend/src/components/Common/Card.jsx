
export default function Card({
  tag: Component = "div",
  title,
  subtitle,
  header,
  children,
  footer,
  className = "",
  bodyClassName = "",
  onClick,
  ...props
}) {
  return (
    <Component
      className={`card app-card h-100 ${className}`}
      onClick={onClick}
      {...props}
    >
      {header}

      <div className={`card-body ${bodyClassName}`}>
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
