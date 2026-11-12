/* ============================================================
   JourneyJar – Trip Sync (Real-time Collaborative Trip Rooms)
   Loaded after script.js. Reuses window.JJ and existing UI helpers.
   ============================================================ */
(function () {
  'use strict';

  // Wait until the main app helpers exist
  const $ = s => document.querySelector(s);
  const E = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rid = () => Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 6);
  const toast = m => { const t = $('#t'); if (t) { t.textContent = m; t.className = 'on'; setTimeout(() => t.className = '', 2400); } };
  const modal = h => { const m = $('#m'); if (m) { m.innerHTML = h; $('#ov').className = 'on'; try { lucide.createIcons(); } catch (_) {} } };
  const cl = () => { const o = $('#ov'); if (o) o.className = ''; };
  const ic = n => `<i data-lucide="${n}"></i>`;
  const fd = d => d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
  const iso = d => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

  // ---------- State ----------
  const TS = {
    roomId: null,          // current open shared trip
    tab: 'overview',       // overview | itinerary | destinations | hotels | budget | members | activity
    trip: null,
    members: [],
    destinations: [],
    itinerary: [],
    hotels: [],
    expenses: [],
    activities: [],
    myRooms: [],           // list of rooms the user belongs to
    loading: false,
    error: null,
    unsubs: [],            // active onSnapshot unsubscribers
    inviteCode: null,      // pending join code from URL
  };

  // ---------- Helpers ----------
  function fs() {
    if (!window.JJ || !window.JJ.FS) throw new Error('Firebase not ready');
    return window.JJ.FS;
  }
  function uid() {
    return (window.U && window.U.uid) || (window.JJ && window.JJ.currentUser && window.JJ.currentUser()?.uid) || null;
  }
  function uname() {
    const u = window.U || (window.JJ && window.JJ.currentUser && window.JJ.currentUser());
    return (u && (u.displayName || (u.email || '').split('@')[0])) || 'Traveler';
  }
  function uphoto() {
    const u = window.U || (window.JJ && window.JJ.currentUser && window.JJ.currentUser());
    return (u && u.photoURL) || '';
  }
  function isOwner() {
    return TS.trip && TS.trip.ownerId === uid();
  }
  function clearListeners() {
    TS.unsubs.forEach(fn => { try { fn(); } catch (_) {} });
    TS.unsubs = [];
  }
  function addListener(unsub) {
    if (typeof unsub === 'function') TS.unsubs.push(unsub);
  }
  function randomCode(len = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
    return s;
  }
  function initials(name) {
    return String(name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  function avatar(m) {
    if (m.photoURL) return `<img class="ts-av" src="${E(m.photoURL)}" alt="" referrerpolicy="no-referrer">`;
    return `<div class="ts-av ts-av-letter">${E(initials(m.displayName))}</div>`;
  }
  function money(n, cur = 'INR') {
    const SY = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ', JPY: '¥' };
    return (SY[cur] || '') + Math.round(+n || 0).toLocaleString();
  }
  function timeAgo(ts) {
    if (!ts) return '';
    const ms = typeof ts === 'number' ? ts : (ts.toMillis ? ts.toMillis() : +ts);
    const d = Date.now() - ms;
    if (d < 60000) return 'just now';
    if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
    if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
    return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  // ---------- Activity logger ----------
  async function logActivity(tripId, action, description) {
    try {
      const F = fs();
      await F.addDoc(F.collection(F.db, 'trips', tripId, 'activities'), {
        userId: uid(),
        userName: uname(),
        action,
        description: String(description || '').slice(0, 200),
        createdAt: F.serverTimestamp()
      });
    } catch (e) { console.warn('Activity log failed', e); }
  }

  // ---------- Create Room ----------
  async function createRoom(data) {
    const F = fs();
    const userId = uid();
    if (!userId) throw new Error('You must be logged in');

    const tripRef = F.doc(F.collection(F.db, 'trips'));
    const tripId = tripRef.id;
    const code = randomCode(10);
    const now = F.serverTimestamp();

    const batch = F.writeBatch(F.db);

    batch.set(tripRef, {
      name: String(data.name).slice(0, 120),
      destination: String(data.destination).slice(0, 120),
      description: String(data.description || '').slice(0, 500),
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      ownerId: userId,
      inviteCode: code,
      inviteActive: true,
      createdAt: now,
      updatedAt: now
    });

    batch.set(F.doc(F.db, 'trips', tripId, 'members', userId), {
      uid: userId,
      displayName: uname(),
      photoURL: uphoto(),
      role: 'owner',
      joinedAt: now
    });

    batch.set(F.doc(F.db, 'tripInvites', code), {
      tripId,
      tripName: String(data.name).slice(0, 120),
      destination: String(data.destination).slice(0, 120),
      active: true,
      createdBy: userId,
      createdAt: now
    });

    await batch.commit();
    await logActivity(tripId, 'created', 'created this trip room');
    return { tripId, code };
  }

  // ---------- Join Room ----------
  async function joinRoom(code) {
    const F = fs();
    const userId = uid();
    if (!userId) throw new Error('You must be logged in');

    const invSnap = await F.getDoc(F.doc(F.db, 'tripInvites', code));
    if (!invSnap.exists()) throw new Error('Invitation not found or invalid');
    const inv = invSnap.data();
    if (!inv.active) throw new Error('This invitation has been deactivated');

    const tripId = inv.tripId;
    const memRef = F.doc(F.db, 'trips', tripId, 'members', userId);
    const memSnap = await F.getDoc(memRef);
    if (memSnap.exists()) {
      // already a member – just open the room
      return tripId;
    }

    await F.setDoc(memRef, {
      uid: userId,
      displayName: uname(),
      photoURL: uphoto(),
      role: 'member',
      joinedAt: F.serverTimestamp()
    });
    await logActivity(tripId, 'joined', 'joined the room');
    return tripId;
  }

  // ---------- Load my rooms ----------
  async function loadMyRooms() {
    const F = fs();
    const userId = uid();
    if (!userId) { TS.myRooms = []; return; }

    // Query is not possible across subcollections without collection group;
    // we store a lightweight index on the user document for performance.
    // Fallback: the client keeps a local list and also tries to resolve from invites.
    // For simplicity we keep rooms the user has opened / created in session + localStorage.
    try {
      const key = 'jj.ts.rooms:' + userId;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      TS.myRooms = saved;
    } catch (_) { TS.myRooms = []; }
  }

  function rememberRoom(tripId, meta) {
    const userId = uid();
    if (!userId) return;
    const key = 'jj.ts.rooms:' + userId;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    list = list.filter(r => r.id !== tripId);
    list.unshift({ id: tripId, name: meta.name, destination: meta.destination, updatedAt: Date.now() });
    list = list.slice(0, 30);
    localStorage.setItem(key, JSON.stringify(list));
    TS.myRooms = list;
  }

  // ---------- Open a room (subscribe) ----------
  function openRoom(tripId) {
    clearListeners();
    TS.roomId = tripId;
    TS.tab = 'overview';
    TS.loading = true;
    TS.error = null;
    TS.trip = null;
    TS.members = [];
    TS.destinations = [];
    TS.itinerary = [];
    TS.hotels = [];
    TS.expenses = [];
    TS.activities = [];
    render();

    const F = fs();

    // Trip document
    addListener(F.onSnapshot(F.doc(F.db, 'trips', tripId), snap => {
      if (!snap.exists()) {
        TS.error = 'This trip room no longer exists.';
        TS.loading = false;
        clearListeners();
        render();
        return;
      }
      TS.trip = { id: snap.id, ...snap.data() };
      rememberRoom(tripId, TS.trip);
      TS.loading = false;
      render();
    }, err => {
      TS.error = err.message || 'Permission denied';
      TS.loading = false;
      render();
    }));

    // Members
    addListener(F.onSnapshot(F.collection(F.db, 'trips', tripId, 'members'), snap => {
      TS.members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }));

    // Destinations
    addListener(F.onSnapshot(F.query(F.collection(F.db, 'trips', tripId, 'destinations'), F.orderBy('createdAt', 'desc')), snap => {
      TS.destinations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, () => {}));

    // Itinerary
    addListener(F.onSnapshot(F.query(F.collection(F.db, 'trips', tripId, 'itinerary'), F.orderBy('date', 'asc')), snap => {
      TS.itinerary = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, () => {}));

    // Hotels
    addListener(F.onSnapshot(F.query(F.collection(F.db, 'trips', tripId, 'hotels'), F.orderBy('checkIn', 'asc')), snap => {
      TS.hotels = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, () => {}));

    // Expenses
    addListener(F.onSnapshot(F.query(F.collection(F.db, 'trips', tripId, 'expenses'), F.orderBy('date', 'desc')), snap => {
      TS.expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, () => {}));

    // Activity feed (latest 40)
    addListener(F.onSnapshot(F.query(F.collection(F.db, 'trips', tripId, 'activities'), F.orderBy('createdAt', 'desc'), F.limit(40)), snap => {
      TS.activities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, () => {}));
  }

  function leaveRoomView() {
    clearListeners();
    TS.roomId = null;
    TS.trip = null;
    render();
  }

  // ---------- CRUD helpers ----------
  async function addDoc(sub, data) {
    const F = fs();
    const ref = await F.addDoc(F.collection(F.db, 'trips', TS.roomId, sub), {
      ...data,
      createdBy: uid(),
      createdAt: F.serverTimestamp(),
      updatedAt: F.serverTimestamp()
    });
    return ref.id;
  }
  async function updateDoc(sub, id, data) {
    const F = fs();
    await F.updateDoc(F.doc(F.db, 'trips', TS.roomId, sub, id), {
      ...data,
      updatedAt: F.serverTimestamp()
    });
  }
  async function deleteDoc(sub, id) {
    const F = fs();
    await F.deleteDoc(F.doc(F.db, 'trips', TS.roomId, sub, id));
  }

  // ---------- Member actions ----------
  async function removeMember(memberUid) {
    if (!isOwner()) return toast('Only the owner can remove members');
    if (memberUid === uid()) return toast('You cannot remove yourself as owner');
    const F = fs();
    await F.deleteDoc(F.doc(F.db, 'trips', TS.roomId, 'members', memberUid));
    await logActivity(TS.roomId, 'removed', 'removed a member');
    toast('Member removed');
  }

  async function leaveRoom() {
    if (isOwner()) return toast('Owner cannot leave. Transfer ownership or delete the room.');
    const F = fs();
    await F.deleteDoc(F.doc(F.db, 'trips', TS.roomId, 'members', uid()));
    await logActivity(TS.roomId, 'left', 'left the room');
    leaveRoomView();
    toast('You left the room');
  }

  async function regenerateInvite() {
    if (!isOwner()) return;
    const F = fs();
    const oldCode = TS.trip.inviteCode;
    const newCode = randomCode(10);
    const batch = F.writeBatch(F.db);
    // deactivate old
    if (oldCode) batch.update(F.doc(F.db, 'tripInvites', oldCode), { active: false });
    // new invite
    batch.set(F.doc(F.db, 'tripInvites', newCode), {
      tripId: TS.roomId,
      tripName: TS.trip.name,
      destination: TS.trip.destination,
      active: true,
      createdBy: uid(),
      createdAt: F.serverTimestamp()
    });
    batch.update(F.doc(F.db, 'trips', TS.roomId), { inviteCode: newCode, inviteActive: true });
    await batch.commit();
    toast('New invitation link generated');
  }

  async function deactivateInvite() {
    if (!isOwner()) return;
    const F = fs();
    const code = TS.trip.inviteCode;
    if (code) await F.updateDoc(F.doc(F.db, 'tripInvites', code), { active: false });
    await F.updateDoc(F.doc(F.db, 'trips', TS.roomId), { inviteActive: false });
    toast('Invitation deactivated');
  }

  // ---------- Safe room deletion ----------
  async function deleteRoom() {
    if (!isOwner()) return toast('Only the owner can delete the room');
    if (!confirm('Delete this entire trip room and all shared data? This cannot be undone.')) return;

    const F = fs();
    const tripId = TS.roomId;
    const collections = ['members', 'destinations', 'itinerary', 'hotels', 'expenses', 'activities'];

    try {
      for (const col of collections) {
        let more = true;
        while (more) {
          const snap = await F.getDocs(F.query(F.collection(F.db, 'trips', tripId, col), F.limit(400)));
          if (snap.empty) { more = false; break; }
          const batch = F.writeBatch(F.db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          if (snap.size < 400) more = false;
        }
      }
      // delete invite
      if (TS.trip && TS.trip.inviteCode) {
        try { await F.deleteDoc(F.doc(F.db, 'tripInvites', TS.trip.inviteCode)); } catch (_) {}
      }
      // finally parent
      await F.deleteDoc(F.doc(F.db, 'trips', tripId));
      leaveRoomView();
      toast('Trip room deleted');
    } catch (e) {
      console.error(e);
      toast('Deletion failed: ' + (e.message || e.code));
    }
  }

  // ---------- UI: Main list page ----------
  function renderList() {
    loadMyRooms();
    const rooms = TS.myRooms || [];
    return `
      <div class="ts-hero">
        <div>
          <h2 style="margin:0 0 4px">Trip Sync</h2>
          <p class="mut" style="margin:0">Plan trips together in real time with your friends.</p>
        </div>
        <button class="btn o" onclick="TSUI.createForm()">${ic('plus')} Create Trip Room</button>
      </div>

      <div class="grid a2" style="margin-top:18px">
        <div class="card ts-card-action" onclick="TSUI.createForm()">
          <div class="ts-icon-wrap">${ic('users')}</div>
          <h3>Create a Room</h3>
          <p class="mut">Start a shared trip and invite friends with a link.</p>
        </div>
        <div class="card ts-card-action" onclick="TSUI.joinForm()">
          <div class="ts-icon-wrap">${ic('link')}</div>
          <h3>Join with Code</h3>
          <p class="mut">Enter an invitation code you received from a friend.</p>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="row" style="margin-bottom:12px">
          <h3 style="margin:0">My Shared Trips</h3>
        </div>
        ${rooms.length === 0
          ? `<div class="ts-empty"><div style="font-size:40px;margin-bottom:8px">🧳</div>
               <p class="mut">You haven't joined any shared trips yet.<br>Create one or join with an invitation link.</p></div>`
          : `<div class="ts-room-list">${rooms.map(r => `
              <div class="ts-room-row" onclick="TSUI.open('${E(r.id)}')">
                <div class="ts-room-icon">${ic('map')}</div>
                <div style="flex:1;min-width:0">
                  <b>${E(r.name)}</b>
                  <div class="mut">${E(r.destination || '')}</div>
                </div>
                <span class="mut">${ic('chevron-right')}</span>
              </div>`).join('')}</div>`}
      </div>`;
  }

  // ---------- UI: Room dashboard ----------
  function renderRoom() {
    if (TS.loading) return `<div class="ts-loading"><span class="sp"></span><p class="mut">Loading shared trip…</p></div>`;
    if (TS.error) return `<div class="card"><div class="err">${E(TS.error)}</div>
      <button class="btn g" style="margin-top:12px" onclick="TSUI.back()">${ic('arrow-left')} Back</button></div>`;
    if (!TS.trip) return renderList();

    const t = TS.trip;
    const tabs = [
      ['overview', 'Overview', 'layout-dashboard'],
      ['itinerary', 'Itinerary', 'calendar-days'],
      ['destinations', 'Destinations', 'map-pin'],
      ['hotels', 'Hotels', 'bed-double'],
      ['budget', 'Budget', 'wallet'],
      ['members', 'Members', 'users'],
      ['activity', 'Activity', 'activity']
    ];

    return `
      <div class="ts-room-header">
        <button class="btn g s" onclick="TSUI.back()" title="Back">${ic('arrow-left')}</button>
        <div style="flex:1;min-width:0">
          <h2 style="margin:0;font-size:20px">${E(t.name)}</h2>
          <div class="mut">${E(t.destination)} · ${fd(t.startDate)} – ${fd(t.endDate)} · ${TS.members.length} member${TS.members.length !== 1 ? 's' : ''}</div>
        </div>
        <button class="btn o s" onclick="TSUI.inviteModal()">${ic('share-2')} Invite</button>
      </div>

      <div class="ts-tabs">
        ${tabs.map(([id, label, icon]) =>
          `<button class="ts-tab ${TS.tab === id ? 'on' : ''}" onclick="TSUI.tab('${id}')">${ic(icon)}<span>${label}</span></button>`
        ).join('')}
      </div>

      <div class="ts-panel">
        ${TS.tab === 'overview' ? tabOverview() :
          TS.tab === 'itinerary' ? tabItinerary() :
          TS.tab === 'destinations' ? tabDestinations() :
          TS.tab === 'hotels' ? tabHotels() :
          TS.tab === 'budget' ? tabBudget() :
          TS.tab === 'members' ? tabMembers() :
          tabActivity()}
      </div>`;
  }

  function tabOverview() {
    const t = TS.trip;
    const total = TS.expenses.reduce((s, e) => s + (+e.amount || 0), 0);
    return `
      <div class="grid a3">
        <div class="card"><div class="st"><div class="ib" style="color:var(--gold)">${ic('map-pin')}</div>
          <div><span class="mut">Destination</span><b>${E(t.destination)}</b></div></div></div>
        <div class="card"><div class="st"><div class="ib" style="color:var(--gold)">${ic('calendar')}</div>
          <div><span class="mut">Dates</span><b>${fd(t.startDate)} → ${fd(t.endDate)}</b></div></div></div>
        <div class="card"><div class="st"><div class="ib" style="color:var(--gold)">${ic('wallet')}</div>
          <div><span class="mut">Shared expenses</span><b>${money(total)}</b></div></div></div>
      </div>

      ${t.description ? `<div class="card" style="margin-top:14px"><p style="margin:0;line-height:1.55">${E(t.description)}</p></div>` : ''}

      <div class="card" style="margin-top:14px">
        <h3 style="margin:0 0 10px">Members</h3>
        <div class="ts-member-row">
          ${TS.members.slice(0, 8).map(m => `
            <div class="ts-member-chip" title="${E(m.displayName)}">
              ${avatar(m)}
              <span>${E((m.displayName || '').split(' ')[0])}</span>
              ${m.role === 'owner' ? '<span class="ts-owner-badge">Owner</span>' : ''}
            </div>`).join('')}
          ${TS.members.length > 8 ? `<span class="mut">+${TS.members.length - 8} more</span>` : ''}
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="row" style="margin-bottom:10px"><h3 style="margin:0">Recent activity</h3>
          <button class="btn s g" onclick="TSUI.tab('activity')">See all</button></div>
        ${TS.activities.length === 0
          ? '<p class="mut">No activity yet.</p>'
          : `<div class="ts-act-list">${TS.activities.slice(0, 5).map(a => `
              <div class="ts-act-item">
                <div class="ts-act-dot"></div>
                <div><b>${E(a.userName)}</b> ${E(a.description || a.action)}
                  <div class="mut" style="font-size:12px">${timeAgo(a.createdAt)}</div></div>
              </div>`).join('')}</div>`}
      </div>`;
  }

  function tabItinerary() {
    return `
      <div class="row" style="margin-bottom:12px">
        <h3 style="margin:0">Shared Itinerary</h3>
        <button class="btn s" onclick="TSUI.formItinerary()">${ic('plus')} Add</button>
      </div>
      ${TS.itinerary.length === 0
        ? emptyState('calendar-days', 'No itinerary items yet', 'Add activities, places and times for the group.')
        : `<div class="ts-list">${TS.itinerary.map(item => `
            <div class="card ts-item">
              <div class="row">
                <div>
                  <b>${E(item.title)}</b>
                  <div class="mut">${fd(item.date)} ${item.time ? '· ' + E(item.time) : ''} ${item.location ? '· ' + E(item.location) : ''}</div>
                  ${item.description ? `<p style="margin:6px 0 0;font-size:14px">${E(item.description)}</p>` : ''}
                </div>
                <div class="ts-item-actions">
                  <button class="btn g s" onclick="TSUI.formItinerary('${item.id}')">${ic('pencil')}</button>
                  <button class="btn g s" onclick="TSUI.del('itinerary','${item.id}','Itinerary item')">${ic('trash-2')}</button>
                </div>
              </div>
            </div>`).join('')}</div>`}`;
  }

  function tabDestinations() {
    return `
      <div class="row" style="margin-bottom:12px">
        <h3 style="margin:0">Shared Destinations</h3>
        <button class="btn s" onclick="TSUI.formDestination()">${ic('plus')} Add</button>
      </div>
      ${TS.destinations.length === 0
        ? emptyState('map-pin', 'No destinations yet', 'Add places the group wants to visit.')
        : `<div class="ts-list">${TS.destinations.map(d => `
            <div class="card ts-item">
              <div class="row">
                <div>
                  <b>${E(d.name)}</b>
                  ${d.description ? `<p class="mut" style="margin:4px 0 0">${E(d.description)}</p>` : ''}
                  ${d.link ? `<a href="${E(d.link)}" target="_blank" rel="noopener" class="mut" style="font-size:13px">Open link →</a>` : ''}
                </div>
                <div class="ts-item-actions">
                  <button class="btn g s" onclick="TSUI.formDestination('${d.id}')">${ic('pencil')}</button>
                  <button class="btn g s" onclick="TSUI.del('destinations','${d.id}','Destination')">${ic('trash-2')}</button>
                </div>
              </div>
            </div>`).join('')}</div>`}`;
  }

  function tabHotels() {
    return `
      <div class="row" style="margin-bottom:12px">
        <h3 style="margin:0">Shared Hotels</h3>
        <button class="btn s" onclick="TSUI.formHotel()">${ic('plus')} Add</button>
      </div>
      ${TS.hotels.length === 0
        ? emptyState('bed-double', 'No hotels yet', 'Add accommodation details for the group.')
        : `<div class="ts-list">${TS.hotels.map(h => `
            <div class="card ts-item">
              <div class="row">
                <div>
                  <b>${E(h.name)}</b>
                  <div class="mut">${E(h.address || '')}</div>
                  <div class="mut" style="margin-top:4px">${fd(h.checkIn)} → ${fd(h.checkOut)}</div>
                  ${h.bookingDetails ? `<p style="margin:6px 0 0;font-size:13px">${E(h.bookingDetails)}</p>` : ''}
                </div>
                <div class="ts-item-actions">
                  <button class="btn g s" onclick="TSUI.formHotel('${h.id}')">${ic('pencil')}</button>
                  <button class="btn g s" onclick="TSUI.del('hotels','${h.id}','Hotel')">${ic('trash-2')}</button>
                </div>
              </div>
            </div>`).join('')}</div>`}`;
  }

  function tabBudget() {
    const total = TS.expenses.reduce((s, e) => s + (+e.amount || 0), 0);
    const byCat = {};
    const byMember = {};
    TS.expenses.forEach(e => {
      byCat[e.category || 'Other'] = (byCat[e.category || 'Other'] || 0) + (+e.amount || 0);
      const payer = e.paidByName || e.paidBy || 'Unknown';
      byMember[payer] = (byMember[payer] || 0) + (+e.amount || 0);
    });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const members = Object.entries(byMember).sort((a, b) => b[1] - a[1]);

    return `
      <div class="row" style="margin-bottom:12px">
        <h3 style="margin:0">Shared Budget</h3>
        <button class="btn s" onclick="TSUI.formExpense()">${ic('plus')} Add Expense</button>
      </div>

      <div class="grid a2" style="margin-bottom:14px">
        <div class="card"><span class="mut">Total expenses</span><div class="big" style="color:var(--gold)">${money(total)}</div></div>
        <div class="card"><span class="mut">Number of expenses</span><div class="big">${TS.expenses.length}</div></div>
      </div>

      ${cats.length ? `<div class="card" style="margin-bottom:14px"><h3 style="margin:0 0 8px">By category</h3>
        ${cats.map(([k, v]) => `<div class="row" style="margin:4px 0"><span>${E(k)}</span><b>${money(v)}</b></div>`).join('')}</div>` : ''}

      ${members.length ? `<div class="card" style="margin-bottom:14px"><h3 style="margin:0 0 8px">Paid by</h3>
        ${members.map(([k, v]) => `<div class="row" style="margin:4px 0"><span>${E(k)}</span><b>${money(v)}</b></div>`).join('')}</div>` : ''}

      ${TS.expenses.length === 0
        ? emptyState('receipt', 'No expenses yet', 'Add shared costs so everyone stays in sync.')
        : `<div class="ts-list">${TS.expenses.map(e => `
            <div class="card ts-item">
              <div class="row">
                <div>
                  <b>${E(e.title)}</b>
                  <div class="mut">${E(e.category || '')} · ${fd(e.date)} · Paid by ${E(e.paidByName || e.paidBy || '—')}</div>
                  ${e.notes ? `<p class="mut" style="margin:4px 0 0;font-size:13px">${E(e.notes)}</p>` : ''}
                </div>
                <div style="text-align:right">
                  <b style="color:var(--gold)">${money(e.amount)}</b>
                  <div class="ts-item-actions" style="margin-top:6px">
                    <button class="btn g s" onclick="TSUI.formExpense('${e.id}')">${ic('pencil')}</button>
                    <button class="btn g s" onclick="TSUI.del('expenses','${e.id}','Expense')">${ic('trash-2')}</button>
                  </div>
                </div>
              </div>
            </div>`).join('')}</div>`}`;
  }

  function tabMembers() {
    return `
      <div class="row" style="margin-bottom:12px">
        <h3 style="margin:0">Members (${TS.members.length})</h3>
        <button class="btn s" onclick="TSUI.inviteModal()">${ic('user-plus')} Invite</button>
      </div>
      <div class="ts-list">${TS.members.map(m => `
        <div class="card ts-item">
          <div class="row">
            <div class="row" style="gap:10px;justify-content:flex-start">
              ${avatar(m)}
              <div>
                <b>${E(m.displayName)}</b>
                ${m.role === 'owner' ? ' <span class="ts-owner-badge">Owner</span>' : ''}
                <div class="mut" style="font-size:12px">Joined ${timeAgo(m.joinedAt)}</div>
              </div>
            </div>
            <div>
              ${isOwner() && m.uid !== uid()
                ? `<button class="btn g s" onclick="TSUI.removeMember('${m.uid}')">${ic('user-minus')} Remove</button>`
                : m.uid === uid() && !isOwner()
                  ? `<button class="btn g s" onclick="TSUI.leave()">${ic('log-out')} Leave</button>`
                  : ''}
            </div>
          </div>
        </div>`).join('')}</div>

      ${isOwner() ? `
        <div class="card" style="margin-top:16px;border:1px solid #ef444455">
          <h3 style="margin:0 0 8px;color:#f87171">Danger zone</h3>
          <p class="mut" style="margin:0 0 12px">Deleting the room removes all shared data for everyone.</p>
          <button class="btn r" onclick="TSUI.deleteRoom()">${ic('trash-2')} Delete entire room</button>
        </div>` : ''}`;
  }

  function tabActivity() {
    return `
      <h3 style="margin:0 0 12px">Activity feed</h3>
      ${TS.activities.length === 0
        ? emptyState('activity', 'No activity yet', 'Actions by members will appear here in real time.')
        : `<div class="ts-act-list">${TS.activities.map(a => `
            <div class="ts-act-item">
              <div class="ts-act-dot"></div>
              <div>
                <b>${E(a.userName)}</b> ${E(a.description || a.action)}
                <div class="mut" style="font-size:12px">${timeAgo(a.createdAt)}</div>
              </div>
            </div>`).join('')}</div>`}`;
  }

  function emptyState(icon, title, sub) {
    return `<div class="ts-empty">
      <div style="margin-bottom:8px;opacity:.7">${ic(icon)}</div>
      <b>${title}</b>
      <p class="mut" style="margin:4px 0 0">${sub}</p>
    </div>`;
  }

  // ---------- Forms (modals) ----------
  function createForm() {
    modal(`
      <h3>Create Trip Room</h3>
      <div class="fg">
        <div><label>Trip name *</label><input id="ts_name" placeholder="Goa Friends Trip 2026" maxlength="120"></div>
        <div><label>Destination *</label><input id="ts_dest" placeholder="Goa, India" maxlength="120"></div>
        <div><label>Start date</label><input id="ts_start" type="date"></div>
        <div><label>End date</label><input id="ts_end" type="date"></div>
        <div style="grid-column:1/-1"><label>Description (optional)</label>
          <textarea id="ts_desc" rows="2" placeholder="Short note for the group…" maxlength="500"></textarea></div>
      </div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.doCreate()">${ic('plus')} Create Room</button>
      </div>`);
  }

  async function doCreate() {
    const name = ($('#ts_name')?.value || '').trim();
    const destination = ($('#ts_dest')?.value || '').trim();
    const startDate = $('#ts_start')?.value || '';
    const endDate = $('#ts_end')?.value || '';
    const description = ($('#ts_desc')?.value || '').trim();
    const err = [];
    if (!name) err.push('Trip name is required');
    if (!destination) err.push('Destination is required');
    if (startDate && endDate && endDate < startDate) err.push('End date cannot be before start date');
    if (err.length) { $('#ts_err').innerHTML = '<div class="err">' + err.join('<br>') + '</div>'; return; }

    try {
      const btn = document.querySelector('#m .btn.o');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
      const { tripId } = await createRoom({ name, destination, startDate, endDate, description });
      cl();
      openRoom(tripId);
      toast('Trip room created!');
    } catch (e) {
      $('#ts_err').innerHTML = '<div class="err">' + E(e.message || e.code) + '</div>';
    }
  }

  function joinForm() {
    modal(`
      <h3>Join Trip Room</h3>
      <p class="mut">Paste the invitation code or the full link you received.</p>
      <div class="fg"><div style="grid-column:1/-1">
        <label>Invitation code or link</label>
        <input id="ts_join" placeholder="e.g. AB12CD34EF or full URL" >
      </div></div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.doJoin()">${ic('log-in')} Join</button>
      </div>`);
  }

  async function doJoin(codeFromUrl) {
    let raw = codeFromUrl || ($('#ts_join')?.value || '').trim();
    // extract code from full URL if present
    const m = raw.match(/[?&]join=([A-Za-z0-9]+)/i) || raw.match(/([A-Z0-9]{8,14})$/i);
    const code = (m ? m[1] : raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) {
      if ($('#ts_err')) $('#ts_err').innerHTML = '<div class="err">Please enter a valid invitation code</div>';
      else toast('Invalid invitation code');
      return;
    }
    try {
      const tripId = await joinRoom(code);
      cl();
      openRoom(tripId);
      toast('Joined the trip room!');
      // clean URL
      if (history.replaceState) {
        const u = new URL(location.href);
        u.searchParams.delete('join');
        history.replaceState({}, '', u.pathname + u.search);
      }
    } catch (e) {
      const msg = e.message || e.code || 'Could not join';
      if ($('#ts_err')) $('#ts_err').innerHTML = '<div class="err">' + E(msg) + '</div>';
      else toast(msg);
    }
  }

  function inviteModal() {
    if (!TS.trip) return;
    const code = TS.trip.inviteCode || '';
    const active = TS.trip.inviteActive !== false;
    const link = location.origin + location.pathname + '?join=' + code;
    modal(`
      <h3>Invite Friends</h3>
      <p class="mut">Share this link. Anyone with the link can request to join after logging in.</p>
      <div class="ts-invite-box">
        <input id="ts_link" readonly value="${E(link)}" onclick="this.select()">
        <button class="btn s" onclick="TSUI.copyLink()">${ic('copy')} Copy</button>
      </div>
      <div class="row" style="margin-top:12px;justify-content:flex-start;gap:8px">
        <button class="btn" onclick="TSUI.shareWhatsApp()">${ic('message-circle')} WhatsApp</button>
        ${isOwner() ? `
          <button class="btn g" onclick="TSUI.regenInvite()">${ic('refresh-cw')} New code</button>
          <button class="btn g" onclick="TSUI.deactivateInvite()">${active ? 'Deactivate' : 'Already inactive'}</button>
        ` : ''}
      </div>
      <p class="mut" style="margin-top:14px;font-size:12px">Code: <b>${E(code)}</b> · ${active ? 'Active' : 'Deactivated'}</p>
      <button class="btn g" style="margin-top:10px" onclick="cl()">Close</button>`);
  }

  function copyLink() {
    const el = $('#ts_link');
    if (!el) return;
    el.select();
    navigator.clipboard?.writeText(el.value).then(() => toast('Link copied')).catch(() => {
      document.execCommand('copy');
      toast('Link copied');
    });
  }

  function shareWhatsApp() {
    const el = $('#ts_link');
    if (!el) return;
    const text = encodeURIComponent('Join my trip on JourneyJar!\n' + el.value);
    window.open('https://wa.me/?text=' + text, '_blank');
  }

  // ---- Item forms ----
  function formItinerary(id) {
    const item = id ? TS.itinerary.find(x => x.id === id) : null;
    modal(`
      <h3>${item ? 'Edit' : 'Add'} Itinerary Item</h3>
      <div class="fg">
        <div style="grid-column:1/-1"><label>Title *</label><input id="f_title" value="${E(item?.title || '')}" maxlength="120"></div>
        <div><label>Date</label><input id="f_date" type="date" value="${E(item?.date || '')}"></div>
        <div><label>Time</label><input id="f_time" type="time" value="${E(item?.time || '')}"></div>
        <div style="grid-column:1/-1"><label>Location</label><input id="f_loc" value="${E(item?.location || '')}" maxlength="120"></div>
        <div style="grid-column:1/-1"><label>Description</label><textarea id="f_desc" rows="2" maxlength="400">${E(item?.description || '')}</textarea></div>
      </div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.saveItinerary('${id || ''}')">${item ? 'Save' : 'Add'}</button>
      </div>`);
  }

  async function saveItinerary(id) {
    const title = ($('#f_title')?.value || '').trim();
    if (!title) { $('#ts_err').innerHTML = '<div class="err">Title is required</div>'; return; }
    const data = {
      title,
      date: $('#f_date')?.value || '',
      time: $('#f_time')?.value || '',
      location: ($('#f_loc')?.value || '').trim(),
      description: ($('#f_desc')?.value || '').trim()
    };
    try {
      if (id) {
        await updateDoc('itinerary', id, data);
        await logActivity(TS.roomId, 'updated', 'updated an itinerary item');
      } else {
        await addDoc('itinerary', data);
        await logActivity(TS.roomId, 'added', 'added an itinerary item: ' + title);
      }
      cl();
      toast(id ? 'Updated' : 'Added');
    } catch (e) { $('#ts_err').innerHTML = '<div class="err">' + E(e.message) + '</div>'; }
  }

  function formDestination(id) {
    const item = id ? TS.destinations.find(x => x.id === id) : null;
    modal(`
      <h3>${item ? 'Edit' : 'Add'} Destination</h3>
      <div class="fg">
        <div style="grid-column:1/-1"><label>Name *</label><input id="f_name" value="${E(item?.name || '')}" maxlength="120"></div>
        <div style="grid-column:1/-1"><label>Description / notes</label><textarea id="f_desc" rows="2" maxlength="400">${E(item?.description || '')}</textarea></div>
        <div style="grid-column:1/-1"><label>Link (optional)</label><input id="f_link" value="${E(item?.link || '')}" placeholder="https://…"></div>
      </div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.saveDestination('${id || ''}')">${item ? 'Save' : 'Add'}</button>
      </div>`);
  }

  async function saveDestination(id) {
    const name = ($('#f_name')?.value || '').trim();
    if (!name) { $('#ts_err').innerHTML = '<div class="err">Name is required</div>'; return; }
    const data = {
      name,
      description: ($('#f_desc')?.value || '').trim(),
      link: ($('#f_link')?.value || '').trim()
    };
    try {
      if (id) {
        await updateDoc('destinations', id, data);
        await logActivity(TS.roomId, 'updated', 'updated a destination');
      } else {
        await addDoc('destinations', data);
        await logActivity(TS.roomId, 'added', 'added destination: ' + name);
      }
      cl();
      toast(id ? 'Updated' : 'Added');
    } catch (e) { $('#ts_err').innerHTML = '<div class="err">' + E(e.message) + '</div>'; }
  }

  function formHotel(id) {
    const item = id ? TS.hotels.find(x => x.id === id) : null;
    modal(`
      <h3>${item ? 'Edit' : 'Add'} Hotel</h3>
      <div class="fg">
        <div style="grid-column:1/-1"><label>Hotel name *</label><input id="f_name" value="${E(item?.name || '')}" maxlength="120"></div>
        <div style="grid-column:1/-1"><label>Address</label><input id="f_addr" value="${E(item?.address || '')}" maxlength="200"></div>
        <div><label>Check-in</label><input id="f_in" type="date" value="${E(item?.checkIn || '')}"></div>
        <div><label>Check-out</label><input id="f_out" type="date" value="${E(item?.checkOut || '')}"></div>
        <div style="grid-column:1/-1"><label>Booking details</label><textarea id="f_book" rows="2" maxlength="400">${E(item?.bookingDetails || '')}</textarea></div>
      </div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.saveHotel('${id || ''}')">${item ? 'Save' : 'Add'}</button>
      </div>`);
  }

  async function saveHotel(id) {
    const name = ($('#f_name')?.value || '').trim();
    if (!name) { $('#ts_err').innerHTML = '<div class="err">Hotel name is required</div>'; return; }
    const data = {
      name,
      address: ($('#f_addr')?.value || '').trim(),
      checkIn: $('#f_in')?.value || '',
      checkOut: $('#f_out')?.value || '',
      bookingDetails: ($('#f_book')?.value || '').trim()
    };
    try {
      if (id) {
        await updateDoc('hotels', id, data);
        await logActivity(TS.roomId, 'updated', 'updated hotel details');
      } else {
        await addDoc('hotels', data);
        await logActivity(TS.roomId, 'added', 'added hotel: ' + name);
      }
      cl();
      toast(id ? 'Updated' : 'Added');
    } catch (e) { $('#ts_err').innerHTML = '<div class="err">' + E(e.message) + '</div>'; }
  }

  function formExpense(id) {
    const item = id ? TS.expenses.find(x => x.id === id) : null;
    const cats = ['Transportation', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Other'];
    modal(`
      <h3>${item ? 'Edit' : 'Add'} Expense</h3>
      <div class="fg">
        <div style="grid-column:1/-1"><label>Title *</label><input id="f_title" value="${E(item?.title || '')}" maxlength="120"></div>
        <div><label>Amount *</label><input id="f_amt" type="number" min="0" step="1" value="${item ? item.amount : ''}"></div>
        <div><label>Category</label><select id="f_cat">${cats.map(c =>
          `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div><label>Date</label><input id="f_date" type="date" value="${E(item?.date || iso(new Date()))}"></div>
        <div><label>Paid by</label><input id="f_paid" value="${E(item?.paidByName || uname())}" maxlength="60"></div>
        <div style="grid-column:1/-1"><label>Notes</label><textarea id="f_notes" rows="2" maxlength="300">${E(item?.notes || '')}</textarea></div>
      </div>
      <div id="ts_err"></div>
      <div class="row" style="margin-top:14px">
        <button class="btn g" onclick="cl()">Cancel</button>
        <button class="btn o" onclick="TSUI.saveExpense('${id || ''}')">${item ? 'Save' : 'Add'}</button>
      </div>`);
  }

  async function saveExpense(id) {
    const title = ($('#f_title')?.value || '').trim();
    const amount = +($('#f_amt')?.value || 0);
    if (!title) { $('#ts_err').innerHTML = '<div class="err">Title is required</div>'; return; }
    if (!(amount > 0)) { $('#ts_err').innerHTML = '<div class="err">Amount must be greater than 0</div>'; return; }
    const data = {
      title,
      amount,
      category: $('#f_cat')?.value || 'Other',
      date: $('#f_date')?.value || '',
      paidBy: uid(),
      paidByName: ($('#f_paid')?.value || '').trim() || uname(),
      notes: ($('#f_notes')?.value || '').trim()
    };
    try {
      if (id) {
        await updateDoc('expenses', id, data);
        await logActivity(TS.roomId, 'updated', 'updated an expense');
      } else {
        await addDoc('expenses', data);
        await logActivity(TS.roomId, 'added', 'added expense: ' + title);
      }
      cl();
      toast(id ? 'Updated' : 'Added');
    } catch (e) { $('#ts_err').innerHTML = '<div class="err">' + E(e.message) + '</div>'; }
  }

  function del(sub, id, label) {
    if (!confirm('Delete this ' + (label || 'item') + '?')) return;
    deleteDoc(sub, id).then(() => {
      logActivity(TS.roomId, 'deleted', 'deleted a ' + (label || 'item').toLowerCase());
      toast('Deleted');
    }).catch(e => toast(e.message || 'Delete failed'));
  }

  // ---------- Main render entry ----------
  function render() {
    // Only render when the current page is Trip Sync
    if (window.V && window.V.p !== 'sync') return;
    const pg = $('#pg');
    if (!pg) return;
    pg.innerHTML = TS.roomId ? renderRoom() : renderList();
    try { lucide.createIcons(); } catch (_) {}
  }

  // ---------- Public API ----------
  window.TSUI = {
    render,
    open: (id) => openRoom(id),
    back: () => leaveRoomView(),
    tab: (t) => { TS.tab = t; render(); },
    createForm,
    doCreate,
    joinForm,
    doJoin,
    inviteModal,
    copyLink,
    shareWhatsApp,
    regenInvite: () => regenerateInvite().catch(e => toast(e.message)),
    deactivateInvite: () => deactivateInvite().catch(e => toast(e.message)),
    formItinerary,
    saveItinerary,
    formDestination,
    saveDestination,
    formHotel,
    saveHotel,
    formExpense,
    saveExpense,
    del,
    removeMember: (id) => removeMember(id).catch(e => toast(e.message)),
    leave: () => leaveRoom().catch(e => toast(e.message)),
    deleteRoom: () => deleteRoom(),
    // called from main app when page becomes 'sync'
    onEnter: () => {
      if (!uid()) {
        toast('Please log in to use Trip Sync');
        if (typeof window.am === 'function') window.am(0);
        return;
      }
      if (TS.inviteCode) {
        const code = TS.inviteCode;
        TS.inviteCode = null;
        doJoin(code);
      } else {
        render();
      }
    },
    // handle ?join=CODE on page load
    handleJoinParam: () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('join');
      if (code) {
        TS.inviteCode = code.toUpperCase();
        // switch to sync page after auth
        if (window.V) window.V.p = 'sync';
      }
    }
  };

  // Auto-detect join link as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.TSUI.handleJoinParam());
  } else {
    window.TSUI.handleJoinParam();
  }

})();
