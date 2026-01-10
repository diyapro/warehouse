import { useState } from "react";
import KpiCard from "./components/KPICard";
import InventoryTable from "./components/InventoryTable";
import Modal from "./components/Modal";

export default function Dashboard() {
  const [popup, setPopup] = useState(null);
  const [fileName, setFileName] = useState("");

  const [summary, setSummary] = useState({
    low_stock: 0,
    expiry_risk: 0,
    restock_alerts: 0,
    healthy: 0,
  });

  const [inventory, setInventory] = useState([]);

  // ================= CSV UPLOAD =================
  async function uploadCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name); // 👈 SHOW FILE NAME

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/upload-csv", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSummary(data.summary);
    setInventory(data.items);
  }

  const lowStockItems = inventory.filter(item => item.stock <= item.reorder);
  const restockItems = lowStockItems;
  const expiryItems = inventory.filter(item => item.expiry <= 7);

  return (
    <div className="dashboard-bg">

      <header className="topbar">
        Smart Warehouse Inventory Control Panel
      </header>

      {/* ✅ COMPACT UPLOAD BAR */}
      <div className="upload-bar">
        <span className="upload-label">📁 Upload File (CSV)</span>

        <label className="upload-btn">
          Choose File
          <input
            type="file"
            accept=".csv"
            onChange={uploadCSV}
            hidden
          />
        </label>

        {fileName && <span className="file-name">{fileName}</span>}
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <KpiCard icon="📦" title="Low Stock Items" value={summary.low_stock} color="red"
          onClick={() => setPopup("lowStock")} />

        <KpiCard icon="⏰" title="Expiry Risk" value={summary.expiry_risk} color="orange"
          onClick={() => setPopup("expiry")} />

        <KpiCard icon="🔔" title="Restock Alerts" value={summary.restock_alerts} color="purple"
          onClick={() => setPopup("restock")} />

        <KpiCard icon="✅" title="Healthy Stock" value={summary.healthy} color="green" />
      </div>

      <InventoryTable data={inventory.slice(0, 5)} />

      {/* POPUPS */}
      {popup === "lowStock" && (
        <Modal title="📦 Low Stock Items" close={() => setPopup(null)}>
          {lowStockItems.map((item, i) => (
            <div key={i} className="modal-row hoverable">
              <strong>{item.item}</strong>
              <span className="badge danger">{item.category}</span>
              <span>Stock: {item.stock}</span>
            </div>
          ))}
        </Modal>
      )}

      {popup === "restock" && (
        <Modal title="🔔 Restock Required" close={() => setPopup(null)}>
          {restockItems.map((item, i) => (
            <div key={i} className="modal-row hoverable">
              <strong>{item.item}</strong>
              <span className="badge danger">{item.category}</span>
              <span>Stock: {item.stock}</span>
            </div>
          ))}
        </Modal>
      )}

      {popup === "expiry" && (
        <Modal title="⏰ Expiry Risk Items" close={() => setPopup(null)}>
          {expiryItems.map((item, i) => (
            <div key={i} className="modal-row hoverable">
              <strong>{item.item}</strong>
              <span className="badge warning">{item.category}</span>
              <span>{item.expiry} days left</span>
            </div>
          ))}
        </Modal>
      )}

    </div>
  );
}
