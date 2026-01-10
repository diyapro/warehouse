export default function KPICard({ icon, title, value, color, onClick }) {
  return (
    <div
      className={`kpi-card ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  );
}
