import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import api from './client'

const provider = new GoogleAuthProvider()

/**
 * Signs in with Google, then checks whether a BloodDrop profile exists.
 * Returns { status: 'existing', user } or { status: 'new', googleInfo }
 */
export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, provider)
  const { displayName, email, phoneNumber } = credential.user

  try {
    const { data } = await api.post('/api/auth/login')
    return { status: 'existing', user: data.user }
  } catch (err) {
    if (err.response?.status === 404) {
      // Firebase account exists, but no BloodDrop profile yet
      return {
        status: 'new',
        googleInfo: {
          name: displayName || '',
          email: email || '',
          phone: phoneNumber || '',
        },
      }
    }
    // 403 (pending/suspended) or anything else — don't leave them half-signed-in
    await signOut(auth)
    throw err
  }
}