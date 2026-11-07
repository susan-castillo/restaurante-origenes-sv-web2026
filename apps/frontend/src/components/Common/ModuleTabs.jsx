
export default function ModuleTabs({
  tabs,
  activa,
  onChange,
}) {
  return (
    <div className="module-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activa === tab.id}
          className={`btn module-tab ${
            activa === tab.id ? "active" : ""
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
