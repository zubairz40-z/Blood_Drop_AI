import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../config/firebase'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  return { user: result.user, credential }
}

export function googleFriendlyMessage(err) {
  switch (err.code) {
    case 'auth/popup-closed-by-user':
      return null
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site.'
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Please contact support.'
    default:
      return err.message || 'Google sign-in failed. Please try again.'
  }
}
