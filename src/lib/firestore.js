import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { HOUSEHOLD_ID } from '../config.js';

const householdRef = () => doc(db, 'households', HOUSEHOLD_ID);
const fixedBillsCol = () => collection(householdRef(), 'fixedBills');
const fixedIncomeCol = () => collection(householdRef(), 'fixedIncome');
const monthsCol = () => collection(householdRef(), 'months');
const monthClosesCol = () => collection(householdRef(), 'monthCloses');
export const monthDocRef = (monthKey) => doc(monthsCol(), monthKey);
export const monthCloseDocRef = (monthKey) => doc(monthClosesCol(), monthKey);
export const categoriesCol = (monthKey) => collection(monthDocRef(monthKey), 'categories');
export const transactionsCol = (monthKey) => collection(monthDocRef(monthKey), 'transactions');
export const incomeCol = (monthKey) => collection(monthDocRef(monthKey), 'incomeEvents');
export { monthClosesCol };

// ---------- Fixed bills (household-level) ----------
export async function addFixedBill(bill) {
  return addDoc(fixedBillsCol(), {
    ...bill,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function updateFixedBill(id, patch) {
  return updateDoc(doc(fixedBillsCol(), id), { ...patch, updatedAt: serverTimestamp() });
}
export async function deleteFixedBill(id) {
  return deleteDoc(doc(fixedBillsCol(), id));
}
export { fixedBillsCol, fixedIncomeCol };

// ---------- Fixed income (household-level, e.g. salary) ----------
export async function addFixedIncome(entry) {
  return addDoc(fixedIncomeCol(), {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function updateFixedIncome(id, patch) {
  return updateDoc(doc(fixedIncomeCol(), id), { ...patch, updatedAt: serverTimestamp() });
}
export async function deleteFixedIncome(id) {
  return deleteDoc(doc(fixedIncomeCol(), id));
}

// ---------- Month meta ----------
export async function getMonthMeta(monthKey) {
  const snap = await getDoc(monthDocRef(monthKey));
  return snap.exists() ? snap.data() : null;
}

export async function setMonthMeta(monthKey, patch) {
  await setDoc(monthDocRef(monthKey), patch, { merge: true });
}

// ---------- Categories ----------
export async function writeCategoriesForMonth(monthKey, categories) {
  const batch = writeBatch(db);
  for (const c of categories) {
    const ref = c.id ? doc(categoriesCol(monthKey), c.id) : doc(categoriesCol(monthKey));
    batch.set(ref, {
      name: c.name,
      maxBudget: c.maxBudget,
      color: c.color,
    });
  }
  await batch.commit();
}

export async function upsertCategory(monthKey, category) {
  const ref = category.id
    ? doc(categoriesCol(monthKey), category.id)
    : doc(categoriesCol(monthKey));
  await setDoc(ref, {
    name: category.name,
    maxBudget: category.maxBudget,
    color: category.color,
  }, { merge: true });
  return ref.id;
}

export async function deleteCategory(monthKey, id) {
  await deleteDoc(doc(categoriesCol(monthKey), id));
}

export async function getCategoriesForMonth(monthKey) {
  const snap = await getDocs(categoriesCol(monthKey));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Transactions ----------
export async function addTransaction(monthKey, tx) {
  return addDoc(transactionsCol(monthKey), {
    ...tx,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTransaction(monthKey, id) {
  return deleteDoc(doc(transactionsCol(monthKey), id));
}

// ---------- Income ----------
export async function addIncome(monthKey, ev) {
  return addDoc(incomeCol(monthKey), {
    ...ev,
    createdAt: serverTimestamp(),
  });
}

export async function updateIncome(monthKey, id, patch) {
  return updateDoc(doc(incomeCol(monthKey), id), patch);
}

export async function deleteIncome(monthKey, id) {
  return deleteDoc(doc(incomeCol(monthKey), id));
}

// ---------- Reconcile a variable recurring bill transaction ----------
export async function reconcileTransaction(monthKey, txId, actualAmountCents, { uid, name } = {}) {
  const patch = {
    actualAmount: actualAmountCents,
    amount: actualAmountCents,
    reconciledAt: serverTimestamp(),
  };
  if (uid !== undefined) patch.reconciledBy = uid || null;
  if (name !== undefined) patch.reconciledByName = name || null;
  await updateDoc(doc(transactionsCol(monthKey), txId), patch);
}

// ---------- Month close ----------
export async function writeMonthClose(monthKey, data) {
  await setDoc(monthCloseDocRef(monthKey), {
    ...data,
    closedAt: serverTimestamp(),
  });
  await setDoc(monthDocRef(monthKey), { closed: true }, { merge: true });
}

export async function getMonthClose(monthKey) {
  const snap = await getDoc(monthCloseDocRef(monthKey));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
