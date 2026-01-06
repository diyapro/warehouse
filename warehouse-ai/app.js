function loadData() {

    const items = [
        { item: "Wireless Mouse", stock: 5, reorder: 15, lead: 7, rec: 50 },
        { item: "Office Chair", stock: 8, reorder: 20, lead: 5, rec: 60 },
        { item: "HDMI Cable", stock: 12, reorder: 25, lead: 6, rec: 80 },
        { item: "Printer Paper", stock: 30, reorder: 50, lead: 4, rec: 100 }
    ];

    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";

    items.forEach(i => {
        tableBody.innerHTML += `
            <tr>
                <td>${i.item}</td>
                <td>${i.stock}</td>
                <td>${i.reorder}</td>
                <td>${i.lead}</td>
                <td>${i.rec}</td>
            </tr>
        `;
    });
}
