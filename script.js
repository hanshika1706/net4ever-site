// 1. YOUR REAL CONFIG (Paste the part you copied from Firebase here)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjgY7RUJXg0oCgtOI6zgKmBnEcvBlZOIM",
  authDomain: "net4ever-95dfd.firebaseapp.com",
  projectId: "net4ever-95dfd",
  storageBucket: "net4ever-95dfd.firebasestorage.app",
  messagingSenderId: "629457995654",
  appId: "1:629457995654:web:79f631d8cb9e838832ce07",
  measurementId: "G-L77EQSH86T"
};

// 2. INITIALIZE (This MUST be at the top to fix the red error)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. AUTHENTICATION LOGIC
function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch(err => {
            document.getElementById('loginError').innerText = "Login Failed: " + err.message;
        });
}

function logout() {
    firebase.auth().signOut();
}

firebase.auth().onAuthStateChanged((user) => {
    const loginPage = document.getElementById('loginPage');
    const appContents = document.getElementById('appContents');

    if (user) {
        loginPage.style.display = 'none';
        appContents.style.display = 'block';
        renderLists(); 
    } else {
        loginPage.style.display = 'flex';
        appContents.style.display = 'none';
    }
});

// 4. DATA LOGIC
async function renderLists() {
    const dueList = document.getElementById('dueList');
    const allList = document.getElementById('allList');
    if (!dueList || !allList) return; 

    dueList.innerHTML = '';
    allList.innerHTML = '';

    const snapshot = await db.collection('customers').get();
    const today = new Date();

    snapshot.forEach(doc => {
        const customer = doc.data();
        const customerId = doc.id;
        const [day, month, year] = customer.nextDue.split('-');
        const dueDate = new Date(`${year}-${month}-${day}`);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <strong>${customer.name}</strong><br>
                Phone: ${customer.phone}<br>
                Due: ${customer.nextDue}
            </div>
            <button onclick="renewCustomer('${customerId}', '${customer.nextDue}')" class="btn-add">Renew</button>
        `;

        if (dueDate <= today) {
            dueList.appendChild(card);
        } else {
            allList.appendChild(card);
        }
    });
}

// 5. RENEW & ADD FUNCTIONS
async function renewCustomer(id, currentDue) {
    const [d, m, y] = currentDue.split('-');
    let nextDate = new Date(`${y}-${m}-${d}`);
    nextDate.setMonth(nextDate.getMonth() + 1);

    const newDue = `${String(nextDate.getDate()).padStart(2, '0')}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${nextDate.getFullYear()}`;
    await db.collection('customers').doc(id).update({ nextDue: newDue });
    renderLists();
}

async function addNewCustomer() {
    const name = document.getElementById('newName').value;
    const phone = document.getElementById('newPhone').value;
    const nextDueRaw = document.getElementById('newDate').value;
    if (!name || !phone || !nextDueRaw) return alert("Fill all fields");

    const [y, m, d] = nextDueRaw.split('-');
    const nextDue = `${d}-${m}-${y}`;

    await db.collection('customers').add({ name, phone, nextDue });
    renderLists();
}

// 6. EXCEL UPLOAD
document.getElementById('excelUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        for (const row of json) {
            await db.collection('customers').add({
                name: row.Name || row.name,
                phone: row.Phone || row.phone,
                nextDue: row['Due Date'] || row.nextDue
            });
        }
        alert("Synced to Cloud!");
        renderLists();
    };
    reader.readAsArrayBuffer(file);
});