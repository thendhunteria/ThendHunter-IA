const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('--- USER DB SNAPSHOT ---');
    console.log('TOTAL USERS COUNT:', snap.docs.length);
    snap.docs.forEach(d => {
      console.log('UID:', d.id, '-> Data:', JSON.stringify(d.data()));
    });
  } catch (e) {
    console.error('Error listing users:', e.message);
  }
  process.exit(0);
}
check();
