// Install event: cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-cache').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './manifest.json'
        // add other static assets if needed (icons, scripts)
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'app-cache').map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event: serve cached files when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// Background Sync: push unsynced charges/payments
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-charges') {
    event.waitUntil(syncCharges());
  }
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

// --- IndexedDB helpers inside SW ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('chargesDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Sync charges
async function syncCharges() {
  const db = await openDB();
  const tx = db.transaction('charges', 'readonly');
  const store = tx.objectStore('charges');
  const getAllReq = store.getAll();

  return new Promise((resolve) => {
    getAllReq.onsuccess = async () => {
      const charges = getAllReq.result;
      for (const charge of charges) {
        if (!charge.synced) {
          try {
            await fetch('/api/addCharge', {
              method: 'POST',
              body: JSON.stringify(charge),
              headers: { 'Content-Type': 'application/json' }
            });
            charge.synced = true;
            const tx2 = db.transaction('charges', 'readwrite');
            tx2.objectStore('charges').put(charge);
          } catch (err) {
            console.log('Still offline, will retry later');
          }
        }
      }
      resolve();
    };
  });
}

// Sync payments
async function syncPayments() {
  const db = await openDB();
  const tx = db.transaction('payments', 'readonly');
  const store = tx.objectStore('payments');
  const getAllReq = store.getAll();

  return new Promise((resolve) => {
    getAllReq.onsuccess = async () => {
      const payments = getAllReq.result;
      for (const payment of payments) {
        if (!payment.synced) {
          try {
            await fetch('/api/addPayment', {
              method: 'POST',
              body: JSON.stringify(payment),
              headers: { 'Content-Type': 'application/json' }
            });
            payment.synced = true;
            const tx2 = db.transaction('payments', 'readwrite');
            tx2.objectStore('payments').put(payment);
          } catch (err) {
            console.log('Still offline, will retry later');
          }
        }
      }
      resolve();
    };
  });
}
