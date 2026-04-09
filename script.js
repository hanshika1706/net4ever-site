const db = new Dexie("Net4EverDB");
db.version(1).stores({ customers: '++id, name, phone, nextDue' });

// Function to show data on screen
async function renderLists() {
    const all = await db.customers.toArray();
    const today = new Date().toISOString().split('T')[0];
    const dueDiv = document.getElementById('dueList');
    const allDiv = document.getElementById('allList');
    
    dueDiv.innerHTML = ''; 
    allDiv.innerHTML = '';

    if (all.length === 0) {
        allDiv.innerHTML = "<p style='color:gray'>No customers found. Please upload Excel.</p>";
    }

    all.forEach(c => {
        const item = document.createElement('div');
        item.className = 'customer-card';
        item.innerHTML = `
            <strong>${c.name}</strong><br>
            Phone: ${c.phone}<br>
            Due Date: ${c.nextDue}<br>
            <button class="btn-paid" onclick="markAsPaid(${c.id}, '${c.nextDue}')">Renew (Paid)</button>
        `;
        if (c.nextDue <= today) { dueDiv.appendChild(item); } 
        else { allDiv.appendChild(item); }
    });
}

// Logic for Excel Upload
document.getElementById('excelUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        console.log("Excel Data Detected:", jsonData[0]); // This helps us debug

        jsonData.forEach(async (row) => {
            await db.customers.add({
                // Using exact headers from your file
                name: row['Cust Name/Username'] || row['NAME'] || "Unknown",
                phone: row['Mobile'] || row['PHONE'] || "N/A",
                nextDue: row['Expired On'] || row['DATE'] || new Date().toISOString().split('T')[0]
            });
        });
        alert("Import Successful!");
        renderLists();
    };
    reader.readAsArrayBuffer(file);
});

async function markAsPaid(id, currentDueDate) {
    let d = new Date(currentDueDate);
    d.setMonth(d.getMonth() + 1);
    await db.customers.update(id, { nextDue: d.toISOString().split('T')[0] });
    renderLists();
}

// Run this when page loads
renderLists();