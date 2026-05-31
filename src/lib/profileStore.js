import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const ROOM_INVITE_DURATION_MS = 5000;

export async function loadOrCreateProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) return { id: user.uid, ...snapshot.data() };

  const username = createUsername(user);
  const profile = {
    name: user.displayName || createProfileName(user),
    username,
    normalizedUsername: normalizeUsername(username),
    email: user.email || "",
    phone: user.phoneNumber || "",
    normalizedPhone: normalizePhone(user.phoneNumber),
    photoUrl: user.photoURL || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(profileRef, profile);
  return { id: user.uid, ...profile };
}

export async function updateStoredProfile(uid, updates) {
  const safeUpdates = {
    ...updates,
    normalizedPhone: normalizePhone(updates.phone),
    normalizedUsername: normalizeUsername(updates.username),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), safeUpdates, { merge: true });
  return safeUpdates;
}

export async function searchStoredProfile(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const profiles = query(
    collection(db, "users"),
    where("normalizedPhone", "==", normalizedPhone),
    limit(1)
  );
  const snapshot = await getDocs(profiles);
  if (snapshot.empty) return null;

  const match = snapshot.docs[0];
  return { id: match.id, ...match.data() };
}

export async function sendStoredRoomInvite({ fromProfile, roomId, toProfile }) {
  const requestRef = doc(collection(db, "users", toProfile.id, "roomRequests"));
  const outgoingRef = doc(db, "users", fromProfile.id, "outgoingRequests", requestRef.id);
  const expiresAt = new Date(Date.now() + ROOM_INVITE_DURATION_MS);
  const batch = writeBatch(db);

  batch.set(requestRef, {
    fromUid: fromProfile.id,
    fromName: fromProfile.name || "",
    fromUsername: fromProfile.username || "",
    fromPhotoUrl: fromProfile.photoUrl || "",
    roomId,
    status: "pending",
    createdAt: serverTimestamp(),
    expiresAt,
  });
  batch.set(outgoingRef, {
    toUid: toProfile.id,
    toName: toProfile.name || toProfile.username || "Talknesty user",
    toPhotoUrl: toProfile.photoUrl || "",
    roomId,
    status: "pending",
    createdAt: serverTimestamp(),
    expiresAt,
  });
  await batch.commit();
  return requestRef.id;
}

export function subscribeStoredRoomInvites(uid, onChange, onError = () => {}) {
  return onSnapshot(collection(db, "users", uid, "roomRequests"), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, onError);
}

export function subscribeStoredOutgoingInvites(uid, onChange, onError = () => {}) {
  return onSnapshot(collection(db, "users", uid, "outgoingRequests"), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, onError);
}

export async function finishStoredRoomInvite(uid, invite, status) {
  const outgoingRef = doc(db, "users", invite.fromUid, "outgoingRequests", invite.id);
  await deleteDoc(doc(db, "users", uid, "roomRequests", invite.id));
  await updateDoc(outgoingRef, {
    status,
    respondedAt: serverTimestamp(),
  }).catch(() => {});
}

export async function expireStoredOutgoingInvite(uid, requestId) {
  await updateDoc(doc(db, "users", uid, "outgoingRequests", requestId), {
    status: "expired",
    respondedAt: serverTimestamp(),
  });
}

export async function saveStoredContact(uid, profile) {
  await setDoc(doc(db, "users", uid, "contacts", profile.id), {
    uid: profile.id,
    name: profile.name || "",
    username: profile.username || "",
    phone: profile.phone || "",
    photoUrl: profile.photoUrl || "",
    createdAt: serverTimestamp(),
  });
}

export async function loadStoredContacts(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "contacts"));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export function normalizePhone(phone = "") {
  const value = String(phone).trim();
  if (!value) return "";
  return `+${value.replace(/\D/g, "")}`;
}

export function normalizeUsername(username = "") {
  return String(username).trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function createUsername(user) {
  const base = (user.email?.split("@")[0] || user.displayName || "talknesty")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18);
  return `${base || "talknesty"}${user.uid.slice(0, 5).toLowerCase()}`;
}

function createProfileName(user) {
  const emailName = user.email?.split("@")[0]?.trim();
  if (emailName) return emailName;
  const suffix = String(user.phoneNumber || "").replace(/\D/g, "").slice(-4);
  return suffix ? `User ${suffix}` : "Talknesty User";
}
