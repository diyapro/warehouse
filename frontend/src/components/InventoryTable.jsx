import { useState } from "react";

export default function InventoryTable({ data }) {
  const [expanded, setExpanded] = useState(false);

  const visibleData = expanded ? data : data.slice(0, 5);

  return (
    <div className="table-card">
      <h3>Inventory Status</h3>

      <table>
        <thead>
          <tr>
            <th>Item ID</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Reorder</th>
            <th>Expiry</th>
          </tr>
        </thead>

        <tbody>
          {visibleData.map(item => (
            <tr key={item.item_id}>
              <td>{item.item}</td>

              <td>{item.category}</td>

              <td className={item.stock < item.reorder ? "danger-text" : ""}>
                {item.stock}
              </td>

              <td>{item.reorder}</td>

              <td className={item.expiry < 10 ? "warning-text" : ""}>
                {item.expiry} days
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > 5 && (
        <div
          className="view-more"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "View less ↑" : "View more →"}
        </div>
      )}
    </div>
  );
}
