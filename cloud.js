/* Comptes et sauvegarde en ligne (Firebase Auth + Firestore).
   L'appli fonctionne toujours hors-ligne avec les données locales ; si un compte est connecté,
   chaque modification est aussi envoyée dans le document « users/<uid> » du compte.
   Désactivé tant que firebase-config.js ne contient pas de configuration (voir README). */
const Cloud = (function(){
  const cfg = window.FIREBASE_CONFIG;
  const C = {enabled:false, user:null, syncing:false, error:null, lastSync:null};
  if(!cfg || !cfg.apiKey) return C;
  C.enabled = true;

  const V = '10.12.2';
  let auth = null, fs = null, timer = null, busy = false, lastPull = 0;

  const loadScript = src => new Promise((ok,ko)=>{ const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  const changed = () => { if(typeof ui!=='undefined' && ui.tab==='set') render(); };
  const doc = () => fs.collection('users').doc(C.user.uid);
  const stripLocal = d => { const c = JSON.parse(JSON.stringify(d)); delete c.cloudUid; return c; };

  C.errorText = e => {
    const code = (e && e.code) || '';
    const M = {
      'auth/invalid-email':'Adresse e-mail invalide.',
      'auth/email-already-in-use':'Cette adresse e-mail a déjà un compte. Connecte-toi.',
      'auth/weak-password':'Mot de passe trop court (6 caractères minimum).',
      'auth/wrong-password':'E-mail ou mot de passe incorrect.',
      'auth/user-not-found':'E-mail ou mot de passe incorrect.',
      'auth/invalid-credential':'E-mail ou mot de passe incorrect.',
      'auth/too-many-requests':'Trop de tentatives. Réessaie dans quelques minutes.',
      'auth/network-request-failed':'Pas de connexion internet.',
      'auth/requires-recent-login':'Pour des raisons de sécurité, reconnecte-toi puis réessaie.',
      'unavailable':'Pas de connexion internet.',
      'no-service':"Le service de comptes n'est pas disponible pour le moment.",
    };
    return t(M[code] || "Une erreur est survenue. Réessaie.");
  };

  C.ready = (async()=>{
    for(const f of ['app','auth','firestore']) await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-${f}-compat.js`);
    firebase.initializeApp(cfg);
    auth = firebase.auth(); fs = firebase.firestore();
    auth.onAuthStateChanged(async u=>{
      C.user = u;
      if(u){ try{ await reconcile(); }catch(e){ C.error = e; } }
      changed();
    });
  })().catch(()=>{ C.unavailable = true; });

  const need = async()=>{ await C.ready; if(!auth) throw {code:'no-service'}; };

  /* Compare les données de l'appareil et celles du compte, puis aligne les deux. */
  async function reconcile(){
    if(!C.user || busy) return; busy = true;
    try{
      const snap = await doc().get();
      const uidNow = C.user.uid;
      if(!snap.exists){ await push(true); return; }
      const remote = snap.data(), rdb = JSON.parse(remote.data);
      const localEmpty = !db.tx.length;
      const adopt = () => { rdb.cloudUid = uidNow; rdb.updatedAt = remote.updatedAt; replaceDb(rdb,true); };
      if(db.cloudUid===uidNow){
        if(remote.updatedAt > (db.updatedAt||0)) adopt();
        else if((db.updatedAt||0) > remote.updatedAt) await push(true);
      }else if(localEmpty){
        adopt();
      }else{
        const choice = await ask(t('Données trouvées sur ce compte'),t('Cet appareil contient déjà des données, et ton compte aussi. Lesquelles garder ?'),[
          {v:'local',label:t('Garder celles de cet appareil'),sub:t('Elles remplaceront la sauvegarde du compte')},
          {v:'cloud',label:t('Récupérer celles du compte'),sub:t('Elles remplaceront les données de cet appareil')},
        ],{locked:true});
        if(choice==='cloud') adopt(); else await push(true);
      }
      C.error = null;
    }finally{ busy = false; }
  }

  async function push(force){
    if(!C.user) return;
    clearTimeout(timer); C.syncing = true; changed();
    try{
      db.cloudUid = C.user.uid;
      try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){}
      await doc().set({data:JSON.stringify(stripLocal(db)), updatedAt:db.updatedAt||Date.now()});
      C.lastSync = Date.now(); C.error = null;
    }catch(e){ C.error = e; throw e; }
    finally{ C.syncing = false; changed(); }
  }

  C.schedulePush = ()=>{
    if(!C.user || busy) return;
    clearTimeout(timer);
    timer = setTimeout(()=>{ push().catch(()=>{}); }, 1500);
  };
  C.pushNow = async()=>{ await need(); if(!C.user) throw {code:'no-service'}; await push(true); };

  C.signUp = async(mail,pass)=>{
    await need();
    const cred = await auth.createUserWithEmailAndPassword(mail,pass);
    try{ await cred.user.sendEmailVerification(); }catch(e){}
  };
  C.signIn = async(mail,pass)=>{ await need(); await auth.signInWithEmailAndPassword(mail,pass); };
  C.reset = async mail => { await need(); await auth.sendPasswordResetEmail(mail); };
  C.verify = async()=>{ await need(); await auth.currentUser.sendEmailVerification(); };
  C.signOut = async()=>{ clearTimeout(timer); await need(); await auth.signOut(); C.lastSync = null; };
  C.deleteAccount = async()=>{
    await need(); const u = auth.currentUser;
    await doc().delete();
    await u.delete();
    delete db.cloudUid; try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){}
  };

  // récupère les modifications faites sur un autre appareil quand on revient sur l'appli
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible' || !C.user || Date.now()-lastPull<30000) return;
    lastPull = Date.now(); reconcile().then(changed).catch(()=>{});
  });
  return C;
})();
