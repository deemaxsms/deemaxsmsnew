#!/usr/bin/env node
// Simple Firebase Admin CLI for local operations using the service account JSON.
// Usage:
//  node scripts/firebase-admin.js set users/<docId> '{"field":"value"}'
//  node scripts/firebase-admin.js add product_listings '{"name":"Test","price":1.99}'
//  node scripts/firebase-admin.js get users/<docId>

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function initAdmin() {
  const svcPath = path.resolve(__dirname, '..', 'deemax-3223e-firebase-adminsdk-qg4o1-cbfae26480.json');
  if (fs.existsSync(svcPath)) {
    const serviceAccount = require(svcPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Initialized admin with service account');
  } else {
    admin.initializeApp();
    console.log('Initialized admin with default credentials');
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd) {
    console.log('Usage: node scripts/firebase-admin.js <get|set|add|delete> <path> [json]');
    process.exit(1);
  }

  const target = argv[1];
  const payload = argv[2] ? JSON.parse(argv[2]) : null;

  try {
    if (cmd === 'get') {
      const [col, id] = target.split('/');
      if (!id) throw new Error('Use collection/docId');
      const doc = await db.collection(col).doc(id).get();
      console.log(doc.exists ? doc.data() : 'Not found');
    } else if (cmd === 'set') {
      const [col, id] = target.split('/');
      if (!id) throw new Error('Use collection/docId');
      await db.collection(col).doc(id).set(payload, { merge: true });
      console.log('OK');
    } else if (cmd === 'add') {
      const col = target;
      const docRef = await db.collection(col).add(payload);
      console.log('Added:', docRef.id);
    } else if (cmd === 'delete') {
      const [col, id] = target.split('/');
      await db.collection(col).doc(id).delete();
      console.log('Deleted');
    } else {
      console.log('Unknown command', cmd);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
