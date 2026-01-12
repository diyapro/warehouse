document.addEventListener("DOMContentLoaded", () => {
  console.log("DASHBOARD VERSION 2026-01-12");

  fetch("http://127.0.0.1:5000/analyze-latest")
    .then(response => {
      if (!response.ok) {
        throw new Error("No analysis data available yet");
      }
      return response.json();
    })
    .then(data => {
      console.log("Metrics received:", data);

      const safeSet = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
          el.innerText = value;
        } else {
          console.warn("Missing element:", id);
        }
      };

      // KPI updates (keys EXACTLY match backend)
      safeSet("alertsCount", data.alerts ?? "—");
      safeSet("avgStockDays", data.avgDays ?? "—");
      safeSet("expiryItems", (data.expiryCount ?? 0) + " Items");
      safeSet(
        "financialRisk",
        "₹" + ((data.financialRisk ?? 0) / 100000).toFixed(1) + "L"
      );

      // Placeholders (backend not implemented yet)
     safeSet("totalDemand", data.totalDemand ?? "—");
     safeSet("reorderItems", data.reorderCount ?? "—");

      /* ===============================
         ✅ ADDED: PRODUCT TABLE RENDERING
         =============================== */

      const table = document.getElementById("productTable");

      if (table) {
        table.innerHTML = "";

        if (Array.isArray(data.items) && data.items.length > 0) {
          data.items.forEach(item => {
            const row = `
              <tr>
                <td>${item.item_id}</td>
                <td>—</td>
                <td>${item.current_stock}</td>
                <td>${item.days_left}</td>
                <td>${item.days_to_expiry}</td>
                <td>${item.alert}</td>
                <td>${item.action}</td>
              </tr>
            `;
            table.insertAdjacentHTML("beforeend", row);
          });
        } else {
          table.innerHTML = `
            <tr>
              <td colspan="7" style="text-align:center; opacity:0.7;">
                Product-level data will appear after model integration
              </td>
            </tr>
          `;
        }
      }
    })
    .catch(error => {
      console.error("Dashboard update failed:", error);
      const status = document.getElementById("analysisStatus");
      if (status) {
        status.innerText = "⚠️ Please upload a dataset to view analysis.";
      }
    });
});
