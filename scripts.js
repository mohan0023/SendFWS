document.addEventListener("DOMContentLoaded", function () {
  // Firebase configuration (replace with your actual config)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "sendfws.firebaseapp.com",
    projectId: "sendfws",
    storageBucket: "sendfws.appspot.com",
    messagingSenderId: "533928773248",
    appId: "1:533928773248:web:0831d7e0c1954eba050865"
  };

  // Initialize Firebase
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  console.log("Firebase initialized:", firebaseApp);

  // Supabase configuration (replace with your actual config)
  const supabaseUrl = 'https://lqmnqarggeewyuznlweb.supabase.co';
  const supabaseKey = 'YOUR_SUPABASE_KEY';
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  console.log("Supabase initialized:", supabaseClient);

  // Function to show a section
  function showSection(sectionId) {
    document.querySelectorAll("section").forEach((section) => {
      section.classList.add("hidden");
    });
    document.getElementById(sectionId).classList.remove("hidden");
  }

  // Global function assignments
  window.showLoginSection = function () { showSection("login-section"); };
  window.showSignupSection = function () { showSection("signup-section"); };
  window.showDashboard = function () { showSection("dashboard-section"); };
  window.showQRCodeSection = function () { showSection("qr-section"); };
  window.goToHomePage = function () { showSection("homepage"); };

  // Login Function with basic validation and custom error message
  window.login = async function () {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    if (!email || !password) {
      document.getElementById("login-message").textContent = "Please fill in all fields.";
      document.getElementById("login-message").style.display = "block";
      return;
    }
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log("Login successful:", userCredential.user);
      document.getElementById("login-message").style.display = "none";
      showDashboard();
      fetchFiles();
    } catch (error) {
      let customMessage = "Invalid credentials";
      document.getElementById("login-message").textContent = customMessage;
      document.getElementById("login-message").style.display = "block";
    }
  };

  // Signup Function with password length check and custom error messages
  window.signup = async function () {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    if (!email || !password) {
      document.getElementById("signup-message").textContent = "Please fill in all fields.";
      document.getElementById("signup-message").style.display = "block";
      return;
    }
    if (password.length < 6) {
      document.getElementById("signup-message").textContent = "Password must be at least 6 characters long.";
      document.getElementById("signup-message").style.display = "block";
      return;
    }
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log("Signup successful:", userCredential.user);
      document.getElementById("signup-message").style.display = "none";
      showDashboard();
      fetchFiles();
    } catch (error) {
      document.getElementById("signup-message").textContent = error.message;
      document.getElementById("signup-message").style.display = "block";
    }
  };

  // Logout Function
  window.logout = function () {
    auth.signOut().then(() => { showSection("homepage"); });
  };

  // Fetch and Display Files from Firebase Firestore (filtered by current user's UID)
  async function fetchFiles() {
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "";
    try {
      const snapshot = await db.collection("files")
        .where("uid", "==", auth.currentUser.uid)
        .orderBy("timestamp", "desc")
        .get();
      snapshot.forEach((doc) => {
        const file = doc.data();
        const li = document.createElement("li");
        li.innerHTML = `
          <div>
            <strong>${file.name}</strong><br>
            <small>Uploaded by: ${file.customer_name}</small><br>
            <small>Uploaded on: ${new Date(file.timestamp).toLocaleString()}</small>
          </div>
          <div class="file-actions">
            <button onclick="downloadFile('${file.download_url}', '${file.name}')">Download</button>
            <button onclick="deleteFile('${doc.id}')">Delete</button>
          </div>
        `;
        fileList.appendChild(li);
      });
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

  // Download File Function (using fetch & blob for forced download)
  window.downloadFile = async function(url, name) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Delete File Function
  window.deleteFile = async function (docId) {
    try {
      await db.collection("files").doc(docId).delete();
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Generate QR Code Function
  window.generateQRCode = function () {
    const canvas = document.getElementById("qrcode");
    const shopId = auth.currentUser ? auth.currentUser.uid : null;
    const qrData = `https://sendfws.web.app/upload.html?shopId=${shopId}`;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    QRCode.toCanvas(canvas, qrData, { width: 200 }, (error) => {
      if (error) {
        console.error("Error generating QR code:", error);
      } else {
        console.log("QR code generated successfully");
      }
    });
  };

  // Download QR Code Function
  window.downloadQRCode = function () {
    const canvas = document.getElementById("qrcode");
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "qr_code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check Auth State and display appropriate section
  auth.onAuthStateChanged((user) => {
    if (user) {
      showDashboard();
      fetchFiles();
    } else {
      showSection("homepage");
    }
  });
});
