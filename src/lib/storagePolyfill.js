// ეს ფაილი ამობმას window.storage-ს ბრაუზერის localStorage-ზე,
// რათა App.jsx-ში დაწერილი კოდი უცვლელად იმუშაოს ჩვეულებრივ ვებგვერდზეც.
//
// ყურადღება: localStorage მონაცემებს ინახავს მხოლოდ იმ ბრაუზერში/მოწყობილობაზე,
// საიდანაც შეიყვანეთ ინფორმაცია. თუ გინდათ, რომ მონაცემები საერთო იყოს
// ყველა მოწყობილობაზე (მაგ. რამდენიმე მწვრთნელი/ადმინი სხვადასხვა ტელეფონიდან),
// მომავალში საჭირო იქნება რეალური სერვერული ბაზა (მაგ. Firebase, Supabase).

function makeKey(key, shared) {
  return `fsapp:${shared ? "shared" : "private"}:${key}`;
}

function ensureValidKey(key) {
  if (typeof key !== "string" || key.length === 0 || key.length > 200) {
    throw new Error("არასწორი key");
  }
}

window.storage = {
  async get(key, shared = false) {
    ensureValidKey(key);
    const raw = window.localStorage.getItem(makeKey(key, shared));
    if (raw === null) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    try {
      ensureValidKey(key);
      window.localStorage.setItem(makeKey(key, shared), value);
      return { key, value, shared };
    } catch (e) {
      console.error("storage.set failed:", e);
      return null;
    }
  },

  async delete(key, shared = false) {
    try {
      ensureValidKey(key);
      window.localStorage.removeItem(makeKey(key, shared));
      return { key, deleted: true, shared };
    } catch (e) {
      console.error("storage.delete failed:", e);
      return null;
    }
  },

  async list(prefix = "", shared = false) {
    try {
      const fullPrefix = makeKey(prefix, shared);
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) {
          keys.push(k.slice(`fsapp:${shared ? "shared" : "private"}:`.length));
        }
      }
      return { keys, prefix, shared };
    } catch (e) {
      console.error("storage.list failed:", e);
      return null;
    }
  },
};
