// Client-side UI logic (moved from app.js)
// Populate sample table on Home
function loadData() {
    const items = [
        { item: "Wireless Mouse", stock: 5, reorder: 15, lead: 7, rec: 50 },
        { item: "Office Chair", stock: 8, reorder: 20, lead: 5, rec: 60 },
        { item: "HDMI Cable", stock: 12, reorder: 25, lead: 6, rec: 80 },
        { item: "Printer Paper", stock: 30, reorder: 50, lead: 4, rec: 100 }
    ];

    const tableBody = document.getElementById("table-body");
    if (!tableBody) return;
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

// Tab switching logic
function switchTab(tab) {
    const home = document.getElementById('home-view');
    const form = document.getElementById('form-view');
    const tabHome = document.getElementById('tab-home');
    const tabForm = document.getElementById('tab-form');
    if (tab === 'form') {
        home.style.display = 'none';
        form.style.display = '';
        tabHome.classList.remove('active');
        tabForm.classList.add('active');
    } else {
        home.style.display = '';
        form.style.display = 'none';
        tabForm.classList.remove('active');
        tabHome.classList.add('active');
    }
}

// Handle form submission: POST form data to /predict and display result
async function handlePredictSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const resultDiv = document.getElementById('predict-result');
    resultDiv.textContent = 'Sending request...';

    const submitBtn = form.querySelector('button[type=submit]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Predicting...';
    }

    try {
        const resp = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!resp.ok) {
            const txt = await resp.text();
            resultDiv.textContent = `Server error: ${resp.status} ${txt}`;
            return;
        }

        // Try parse JSON
        const json = await resp.json();
        if (json && ('prediction' in json)) {
            const p = Number(json.prediction);
            const txt = Number.isFinite(p) ? p.toFixed(2) : String(json.prediction);
            resultDiv.innerHTML = `<b>Predicted forecasted_demand_next_7d:</b> <span class="pred-value">${txt}</span>`;
        } else if (json && ('error' in json)) {
            resultDiv.textContent = `Error: ${json.error}`;
        } else {
            resultDiv.textContent = 'Unexpected response: ' + JSON.stringify(json);
        }
    } catch (err) {
        resultDiv.textContent = 'Request failed: ' + err;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Predict';
        }
    }
}

// Reset form
function resetForm() {
    const f = document.getElementById('predict-form');
    if (f) {
        f.reset();
        document.getElementById('predict-result').textContent = '';
    }
}

// Wire up events after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const tabHome = document.getElementById('tab-home');
    const tabForm = document.getElementById('tab-form');
    tabHome && tabHome.addEventListener('click', () => switchTab('home'));
    tabForm && tabForm.addEventListener('click', () => switchTab('form'));

    const form = document.getElementById('predict-form');
    if (form) form.addEventListener('submit', handlePredictSubmit);
    const resetBtn = document.getElementById('form-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
});
