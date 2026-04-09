// Login logic
function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch(err => {
            document.getElementById('loginError').innerText = "Login Failed: " + err.message;
        });
}

// Logout logic
function logout() {
    firebase.auth().signOut();
}

// This "Observer" checks if a user is logged in or out
firebase.auth().onAuthStateChanged((user) => {
    const loginPage = document.getElementById('loginPage');
    const appContents = document.getElementById('appContents');

    if (user) {
        loginPage.style.display = 'none';
        appContents.style.display = 'block';
        renderLists(); // Only show data when logged in
    } else {
        loginPage.style.display = 'flex';
        appContents.style.display = 'none';
    }
});
// 1. YOUR FIREBASE CONFIG (Paste your values from the photo here!)
const firebaseConfig = {
  apiKey: "AIzaSyCjgY7RUJXg0oCGt0i6zgKmBnEcvB1ZOIM",
  authDomain: "net4ever-95dfd.firebaseapp.com",
  projectId: "net4ever-95dfd",
  storageBucket: "net4ever-95dfd.firebasestorage.app",
  messagingSenderId: "629457995654",
  appId: "1:629457995654:web:79f631d8cb9e838832ce07",
  measurementId: "G-L77EQSH86T"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Show Data on Screen
function renderLists() {
    const today = new Date().toISOString().split('T')[0];
    const dueDiv = document.getElementById('dueList');
    const allDiv = document.getElementById('allList');

    // Listen to database changes in REAL-TIME
    db.collection("customers").orderBy("nextDue", "asc").onSnapshot((querySnapshot) => {
        dueDiv.innerHTML = '';
        allDiv.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const c = doc.data();
            const id = doc.id;
            const item = document.createElement('div');
            item.className = 'customer-card';
            item.innerHTML = `
                <strong>${c.name}</strong><br>
                Phone: ${c.phone}<br>
                Due Date: ${c.nextDue}<br>
                <button class="btn-paid" onclick="markAsPaid('${id}', '${c.nextDue}')">Renew (Paid)</button>
            `;

            if (c.nextDue <= today) {
                dueDiv.appendChild(item);
            } else {
                allDiv.appendChild(item);
            }
        });
    });
}

// 4. Excel Upload Logic (Saves to Cloud)
document.getElementById('excelUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        jsonData.forEach((row) => {
            db.collection("customers").add({
                name: row['Cust Name/Username'] || "Unknown",
                phone: row['Mobile'] || "N/A",
                nextDue: row['Expired On'] || new Date().toISOString().split('T')[0]
            });
        });
        alert("Cloud Sync Successful!");
    };
    reader.readAsArrayBuffer(file);
});

// 5. Update Date in Cloud
async function markAsPaid(id, currentDueDate) {
    let d = new Date(currentDueDate);
    d.setMonth(d.getMonth() + 1);
    const newDate = d.toISOString().split('T')[0];
    await db.collection("customers").doc(id).update({ nextDue: newDate });
}

// 6. Manual Add
async function addNewCustomer() {
    const name = document.getElementById('newName').value;
    const phone = document.getElementById('newPhone').value;
    const date = document.getElementById('newDate').value;
    if(name && date) {
        await db.collection("customers").add({ name, phone, nextDue: date });
        document.getElementById('newName').value = '';
        document.getElementById('newPhone').value = '';
    }
}

renderLists();