import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";

function docId(key, shared) {
  return `${shared ? "shared" : "private"}__${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const ref = doc(db, "appData", docId(key, shared));
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: snap.data().value, shared };
  },

  async set(key, value, shared = false) {
    try {
      const ref = doc(db, "appData", docId(key, shared));
      await setDoc(ref, { value });
      return { key, value, shared };
    } catch (e) {
      console.error("storage.set failed:", e);
      return null;
    }
  },

  async delete(key, shared = false) {
    try {
      const ref = doc(db, "appData", docId(key, shared));
      await deleteDoc(ref);
      return { key, deleted: true, shared };
    } catch (e) {
      console.error("storage.delete failed:", e);
      return null;
    }
  },

  async list(prefix = "", shared = false) {
    try {
      const snap = await getDocs(collection(db, "appData"));
      const fullPrefix = docId(prefix, shared);
      const stripLen = `${shared ? "shared" : "private"}__`.length;
      const keys = [];
      snap.forEach((d) => {
        if (d.id.startsWith(fullPrefix)) {
          keys.push(d.id.slice(stripLen));
        }
      });
      return { keys, prefix, shared };
    } catch (e) {
      console.error("storage.list failed:", e);
      return null;
    }
  },
};
