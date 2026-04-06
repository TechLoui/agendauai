import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../config/firebase'

export async function register(email, password, displayName) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName })
  return user
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function logout() {
  await signOut(auth)
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}
