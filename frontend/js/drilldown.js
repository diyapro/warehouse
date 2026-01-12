async function loadDrilldown(type) {
  const table = document.getElementById("drilldownTable");
  table.innerHTML = "";

  const res = await fetch("http://127.0.0.1:5000/analyze-latest");
  const data = await res.json();

  data.items.forEach(item => {

    if (type === "alerts" && item.alert === "YES") {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.alert}</td>
          <td>${item.action}</td>
        </tr>`;
    }

    if (type === "demand") {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.predicted_demand}</td>
        </tr>`;
    }

    if (type === "stock") {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.current_stock}</td>
          <td>${item.days_left}</td>
        </tr>`;
    }

    if (type === "expiry" && item.days_to_expiry <= 30) {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.days_to_expiry}</td>
        </tr>`;
    }

    if (type === "reorder" && item.reorder === "YES") {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>${item.current_stock}</td>
          <td>${item.reorder_level}</td>
        </tr>`;
    }

    if (type === "financial") {
      table.innerHTML += `
        <tr>
          <td>${item.item_id}</td>
          <td>₹${item.financial_risk}</td>
        </tr>`;
    }

  });
}
