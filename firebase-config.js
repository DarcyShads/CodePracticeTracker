// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "{{API_KEY}}",
  authDomain: "questionlist-1c003.firebaseapp.com",
  databaseURL:
    "https://questionlist-1c003-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "questionlist-1c003",
  storageBucket: "questionlist-1c003.firebasestorage.app",
  messagingSenderId: "1022775920744",
  appId: "1:1022775920744:web:32fb2a3f29bb0f08c613dd",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
