import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'

export async function uploadImage(uid, file, folder = 'logos') {
  const ext = file.name.split('.').pop()
  const path = `establishments/${uid}/${folder}/${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function deleteImage(url) {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // ignore if not found
  }
}
