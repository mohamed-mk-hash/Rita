import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase.js";

export async function sendContactMessageRequest(payload) {
  const messageData = {
    full_name:
      payload.fullName?.trim() || "",

    email:
      payload.email
        ?.trim()
        .toLowerCase() || "",

    phone:
      payload.phone?.trim() || "",

    subject:
      payload.subject?.trim() || "",

    message:
      payload.message?.trim() || "",

    status:
      "new",

    created_at:
      serverTimestamp(),

    updated_at:
      serverTimestamp(),
  };

  const documentReference =
    await addDoc(
      collection(
        db,
        "contact_messages"
      ),
      messageData
    );

  return {
    success: true,
    id:
      documentReference.id,
  };
}