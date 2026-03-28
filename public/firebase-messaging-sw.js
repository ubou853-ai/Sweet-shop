importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA5BrgpdJyFSvsDs5Hk_3z7hb18e5633dA",
  authDomain: "gen-lang-client-0542766265.firebaseapp.com",
  projectId: "gen-lang-client-0542766265",
  storageBucket: "gen-lang-client-0542766265.firebasestorage.app",
  messagingSenderId: "216197603808",
  appId: "1:216197603808:web:30e60521a2655fcf088b85"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/vite.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
