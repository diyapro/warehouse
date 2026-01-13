/* ===============================
   DASHBOARD VERSION 2026-01-12
   =============================== */

let allItems = [];
let visibleCount = 50;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DASHBOARD VERSION 2026-01-12");

  fetch("http://127.0.0.1:5000/analyze-latest")
    .then(r => {
      if (!r.ok) throw new Error("No analysis data");
      return r.json();
    })
    .then(data => {
      console.log("Metrics received:", data);

      const safeSet = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value ?? "—";
      };

      // KPI CARDS
      safeSet("alertsCount", data.alerts);
      safeSet("totalDemand", data.totalDemand);
      safeSet("avgStockDays", data.avgDays);
      safeSet("expiryItems", data.expiryCount + " Items");
      safeSet("reorderItems", data.reorderCount);
      safeSet(
        "financialRisk",
        "₹" + (data.financialRisk / 100000).toFixed(1) + "L"
      );

      // TABLE
      allItems = data.items || [];
      visibleCount = 50;
      renderTable();
    })
    .catch(err => {
      console.error(err);
      document.getElementById("analysisStatus").innerText =
        "⚠️ Please upload inventory data first.";
    });
});

function renderTable() {
  const table = document.getElementById("productTable");
  const btn = document.getElementById("viewMoreBtn");

  table.innerHTML = "";

  allItems.slice(0, visibleCount).forEach(item => {
    table.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${item.item_id}</td>
        <td>${item.predicted_demand}</td>
        <td>${item.current_stock}</td>
        <td>${item.days_left}</td>
        <td>${item.days_to_expiry}</td>
        <td>${item.alert}</td>
        <td>${item.action}</td>
      </tr>
      `
    );
  });

  btn.style.display = visibleCount >= allItems.length ? "none" : "block";
}

document.getElementById("viewMoreBtn").onclick = () => {
  visibleCount += 50;
  renderTable();
};
