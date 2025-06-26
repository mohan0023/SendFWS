document.addEventListener("DOMContentLoaded", function () {
  // Initialize Supabase (for Storage)
  const supabaseUrl = 'https://lqmnqarggeewyuznlweb.supabase.co';
  const supabaseKey = 'YOUR_SUPABASE_KEY'; // Replace with your actual key or use a server-side proxy
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

  // Initialize Firebase (for Firestore Database)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual key or use a server-side proxy
    authDomain: "sendfws.firebaseapp.com",
    projectId: "sendfws",
    storageBucket: "sendfws.appspot.com",
    messagingSenderId: "533928773248",
    appId: "1:533928773248:web:0831d7e0c1954eba050865"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Upload File Function with Loading Indicator
  window.uploadFile = async function () {
    const fileInput = document.getElementById('file-input');
    const customerName = document.getElementById('customer-name').value;
    const file = fileInput.files[0];

    // Show loading message
    document.getElementById('loading-message').style.display = 'block';
    // Hide previous messages
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';

    if (!file || !customerName) {
      showError('Please provide your name and select a file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5MB limit.');
      return;
    }

    try {
      // Sanitize the filename (replace spaces and special characters)
      const sanitizedFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabaseClient.storage
        .from('uploads')
        .upload(sanitizedFileName, file);

      if (storageError) {
        console.error('Storage upload error:', storageError);
        throw storageError;
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabaseClient.storage
        .from('uploads')
        .getPublicUrl(storageData.path);

      // Save file metadata to Firebase Firestore (including UID for filtering)
      await db.collection('files').add({
        name: file.name,
        customer_name: customerName,
        timestamp: new Date().toISOString(),
        download_url: urlData.publicUrl,
        uid: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null
      });

      // Hide loading message, show success message
      document.getElementById('loading-message').style.display = 'none';
      document.getElementById('success-message').style.display = 'block';
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Error uploading file. Please try again.');
    }
  };

  function showError(message) {
    document.getElementById('loading-message').style.display = 'none';
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
  }
});
