import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

function employeesRef(uid) {
  return collection(db, 'establishments', uid, 'employees')
}

export async function getEmployees(uid) {
  const q = query(employeesRef(uid), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createEmployee(uid, data) {
  const ref = await addDoc(employeesRef(uid), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateEmployee(uid, employeeId, data) {
  const ref = doc(db, 'establishments', uid, 'employees', employeeId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteEmployee(uid, employeeId) {
  const ref = doc(db, 'establishments', uid, 'employees', employeeId)
  await deleteDoc(ref)
}
