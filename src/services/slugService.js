import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export async function slugExists(slug) {
  const snap = await getDoc(doc(db, 'slugs', slug))
  return snap.exists()
}

export async function reserveSlug(slug, uid, businessName) {
  await setDoc(doc(db, 'slugs', slug), {
    uid,
    slug,
    businessName,
    createdAt: serverTimestamp(),
  })
}

export async function resolveSlug(slug) {
  const snap = await getDoc(doc(db, 'slugs', slug))
  return snap.exists() ? snap.data() : null
}
