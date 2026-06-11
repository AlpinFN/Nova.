import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

async function testStorage() {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const testRef = ref(storage, 'test.txt');
  
  try {
    await uploadString(testRef, 'hello world');
    const url = await getDownloadURL(testRef);
    console.log('Success! URL:', url);
  } catch (error) {
    console.error('Storage error:', error);
  }
}

testStorage();
