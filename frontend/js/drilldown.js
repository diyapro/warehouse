document.addEventListener("DOMContentLoaded", () => {
  const pageTitle =
    document.body.querySelector(".page-header h1")?.innerText || "";

  let type = "";

  if (pageTitle.includes("Alerts")) type = "alerts";
  else if (pageTitle.includes("Demand")) type = "demand";
  else if (pageTitle.includes("Stock")) type = "stock";
  else if (pageTitle.includes("Expiry")) type = "expiry";
  else if (pageTitle.includes("Reorder")) type = "reorder";
  else if (pageTitle.includes("Financial")) type = "financial";

  loadDrilldown(type);
});

async function loadDrilldown(type) {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let res;
  try {
    res = await fetch("http://127.0.0.1:5000/analyze-latest");
  } catch {
    tableBody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;">Backend not reachable</td></tr>
    `;
    return;
  }

  if (!res.ok) {
    tableBody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;">No analysis data</td></tr>
    `;
    return;
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  items.forEach(item => {
    const daysLeft = Number(item.days_left);
    const daysToExpiry = Number(item.days_to_expiry);
    const stock = Number(item.current_stock);

    /* ================= ACTIVE ALERTS ================= */
    if (type === "alerts" && item.alert !== "OK") {
      tableBody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${item.item_id}</td>
          <td>Low Stock</td>
          <td>High</td>
          <td>Stock below reorder point</td>
          <td>${item.action}</td>
        </tr>
        `
      );
    }

    /* ================= DEMAND ================= */
    if (type === "demand") {
      const shortage =
        item.predicted_demand > stock ? "⚠️ Shortage" : "OK";

      tableBody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.predicted_demand}</td>
          <td>${stock}</td>
          <td>${shortage}</td>
        </tr>
        `
      );
    }

    /* ================= STOCK ================= */
    if (type === "stock") {
      const avgDailyUsage =
        item.predicted_demand && item.predicted_demand > 0
          ? (item.predicted_demand / 7).toFixed(1)
          : "—";

      tableBody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${item.item_id}</td>
          <td>${stock}</td>
          <td>${avgDailyUsage}</td>
          <td>${daysLeft}</td>
        </tr>
        `
      );
    }

    /* ================= EXPIRY ================= */
    /* ================= EXPIRY ================= */
if (type === "expiry") {
  const expiryItems = Array.isArray(data.expiryRisk)
    ? data.expiryRisk
    : [];

  expiryItems.forEach(er => {
    tableBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${er.item_id}</td>
        <td>N/A</td>
        <td>${er.days_to_expiry}</td>
        <td>${er.risk}</td>
        <td>${er.risk === "High" ? "Immediate Clearance" : "Monitor"}</td>
      </tr>
      `
    );
  });
}


    /* ================= REORDER ================= */
   if (
  type === "reorder" &&
  item.alert !== "OK" &&
  Number.isFinite(daysLeft) &&
  daysLeft <= 5
) {
  const quantityNeeded = Math.max(
    0,
    Math.round(item.predicted_demand - stock)
  );

  tableBody.insertAdjacentHTML(
    "beforeend",
    `
    <tr>
      <td>${item.item_id}</td>
      <td>${stock}</td>
      <td>${Math.round(item.predicted_demand)}</td>
      <td>${quantityNeeded}</td>
    </tr>
    `
  );
}


    /* ================= FINANCIAL ================= */
    if (type === "financial") {
      const stockValue = Math.round(stock * 1);
      const loss = Math.round(stockValue * 0.1);

      tableBody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${item.item_id}</td>
          <td>₹${stockValue}</td>
          <td>Inventory Holding Risk</td>
          <td>₹${loss}</td>
        </tr>
        `
      );
    }
  });

  if (tableBody.innerHTML.trim() === "") {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; opacity:0.7;">
          No matching records
        </td>
      </tr>
    `;
  }
}
