/* dexie-lite.js - kopia kely an'ny Dexie (IndexedDB) ho an'ny CAT by Manda.
   Mandeha tsy mila internet. Ampiasaina ihany raha tsy voakatra ny Dexie avy amin'ny CDN. */
(function (w) {
  if (w.Dexie) return;

  function parse(spec) {
    var p = spec.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var first = p[0] || '', auto = first.indexOf('++') === 0;
    return { key: first.replace('++', '').replace('&', '') || 'id', auto: auto,
             idx: p.slice(1).map(function (s) { return s.replace(/^[&*]/, ''); }) };
  }

  function Dexie(name) { this.name = name; this._ver = 1; this.tables = []; this._p = null; }

  Dexie.prototype.version = function (v) {
    var db = this; db._ver = v;
    return { stores: function (s) {
      db.tables = [];
      Object.keys(s).forEach(function (n) { var t = new Table(db, n, parse(s[n])); db[n] = t; db.tables.push(t); });
      return this;
    } };
  };

  Dexie.prototype._open = function () {
    var db = this;
    if (db._p) return db._p;
    db._p = new Promise(function (res, rej) {
      var rq = indexedDB.open(db.name, db._ver * 10); // mitovy amin'ny Dexie (version x 10)
      rq.onupgradeneeded = function () {
        var d = rq.result, tx = rq.transaction;
        db.tables.forEach(function (t) {
          var st = d.objectStoreNames.contains(t.name) ? tx.objectStore(t.name)
                 : d.createObjectStore(t.name, { keyPath: t.sc.key, autoIncrement: t.sc.auto });
          t.sc.idx.forEach(function (i) { if (!st.indexNames.contains(i)) st.createIndex(i, i); });
        });
      };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { db._p = null; rej(rq.error); };
    });
    return db._p;
  };

  function Table(db, name, sc) { this.db = db; this.name = name; this.sc = sc; }

  Table.prototype._run = function (mode, fn) {
    var t = this;
    return t.db._open().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(t.name, mode), out;
        tx.oncomplete = function () { res(out); };
        tx.onerror = tx.onabort = function () { rej(tx.error); };
        try { fn(tx.objectStore(t.name), function (v) { out = v; }); } catch (e) { rej(e); }
      });
    });
  };

  Table.prototype.add = function (o) {
    var k = this.sc.key;
    return this._run('readwrite', function (st, set) {
      var r = st.add(o); r.onsuccess = function () { if (o[k] === undefined) o[k] = r.result; set(r.result); };
    });
  };
  Table.prototype.bulkAdd = function (a) {
    var k = this.sc.key;
    return this._run('readwrite', function (st, set) {
      a.forEach(function (o) { var r = st.add(o); r.onsuccess = function () { if (o[k] === undefined) o[k] = r.result; }; });
      set(a.length);
    });
  };
  Table.prototype.put = function (o) {
    return this._run('readwrite', function (st, set) { var r = st.put(o); r.onsuccess = function () { set(r.result); }; });
  };
  Table.prototype.get = function (k) {
    return this._run('readonly', function (st, set) { var r = st.get(k); r.onsuccess = function () { set(r.result); }; });
  };
  Table.prototype.update = function (k, ch) {
    return this._run('readwrite', function (st, set) {
      var g = st.get(k);
      g.onsuccess = function () {
        var o = g.result; if (!o) { set(0); return; }
        for (var p in ch) o[p] = ch[p];
        st.put(o); set(1);
      };
    });
  };
  Table.prototype.delete = function (k) { return this._run('readwrite', function (st) { st.delete(k); }); };
  Table.prototype.clear = function () { return this._run('readwrite', function (st) { st.clear(); }); };
  Table.prototype.count = function () {
    return this._run('readonly', function (st, set) { var r = st.count(); r.onsuccess = function () { set(r.result); }; });
  };
  Table.prototype.toArray = function () { return new Coll(this).toArray(); };
  Table.prototype.reverse = function () { return new Coll(this).reverse(); };
  Table.prototype.where = function (i) {
    var t = this; return { equals: function (v) { return new Coll(t, i, v); } };
  };

  function Coll(t, idx, val) { this.t = t; this.idx = idx; this.val = val; this.rev = false; this.lim = null; this.fl = []; }
  Coll.prototype.reverse = function () { this.rev = !this.rev; return this; };
  Coll.prototype.limit = function (n) { this.lim = n; return this; };
  Coll.prototype.filter = function (f) { this.fl.push(f); return this; };
  Coll.prototype.toArray = function () {
    var c = this;
    return c.t._run('readonly', function (st, set) {
      var r = c.idx ? st.index(c.idx).getAll(c.val) : st.getAll();
      r.onsuccess = function () {
        var a = r.result;
        c.fl.forEach(function (f) { a = a.filter(f); });
        if (c.rev) a = a.reverse();
        if (c.lim != null) a = a.slice(0, c.lim);
        set(a);
      };
    });
  };
  Coll.prototype.first = function () { return this.toArray().then(function (a) { return a[0]; }); };
  Coll.prototype.last = function () { return this.toArray().then(function (a) { return a[a.length - 1]; }); };
  Coll.prototype.count = function () { return this.toArray().then(function (a) { return a.length; }); };

  w.Dexie = Dexie; w.DEXIE_LITE = true;
})(window);
