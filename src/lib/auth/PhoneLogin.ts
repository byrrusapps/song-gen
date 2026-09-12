import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  linkWithCredential,
  type ConfirmationResult,
  type User
} from "firebase/auth";
import { auth } from "../firebase/init/InitFirebase";

// Extend the Window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

// Setup or reuse the invisible ReCAPTCHA
export function setupRecaptcha(): RecaptchaVerifier {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container", // Your div ID in the DOM
      { size: "invisible" }, // Invisible mode
    );
  }

  return window.recaptchaVerifier;
}

// Send the verification code via SMS
export async function sendCode(phoneNumber: string): Promise<ConfirmationResult> {
  try {
    const recaptchaVerifier = setupRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

    recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
    const anchors = document.getElementsByClassName("grecaptcha-badge");
    for (const el of anchors) {
      el.remove();
    }

    return confirmationResult;

  } catch (err) {
    console.error("Error sending phone verification:", err);
    throw err;
  }
}

// Confirm the code and link it to the currently signed-in user
export async function confirmPhoneCodeAndLink(
  confirmationResult: ConfirmationResult, 
  code: string
): Promise<User> {
  if (!confirmationResult) throw new Error("No confirmationResult provided");
  if (!code) throw new Error("No verification code provided");

  const verificationId = confirmationResult.verificationId;
  if (!verificationId) throw new Error("No verificationId found on confirmationResult");

  const credential = PhoneAuthProvider.credential(verificationId, code);

  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No currently signed-in user to link to");

  const linkedUserCred = await linkWithCredential(currentUser, credential);
  return linkedUserCred.user;
}