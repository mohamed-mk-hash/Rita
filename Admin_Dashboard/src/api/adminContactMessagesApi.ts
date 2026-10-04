import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

export type ContactMessageStatus =
  | "new"
  | "read"
  | "replied"
  | "archived";

export interface AdminContactMessageSummary {
  id: string;

  fullName: string;
  email: string;
  phone: string | null;

  subject: string;

  messagePreview: string;

  status: ContactMessageStatus;

  createdAt: string;
  updatedAt: string;
}

export interface AdminContactMessage {
  id: string;

  fullName: string;
  email: string;
  phone: string | null;

  subject: string;
  message: string;

  status: ContactMessageStatus;

  createdAt: string;
  updatedAt: string;
}

interface MessagesResponse {
  messages: AdminContactMessageSummary[];
}

interface MessageResponse {
  message: AdminContactMessage;
}

function toIsoString(
  value: unknown
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as {
      toDate: () => Date;
    }).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return "";
}

function mapMessage(
  id: string,
  data: Record<string, unknown>
): AdminContactMessage {
  return {
    id,

    fullName:
      String(
        data.full_name ||
        ""
      ),

    email:
      String(
        data.email ||
        ""
      ),

    phone:
      data.phone
        ? String(
            data.phone
          )
        : null,

    subject:
      String(
        data.subject ||
        ""
      ),

    message:
      String(
        data.message ||
        ""
      ),

    status:
      (
        data.status ||
        "new"
      ) as ContactMessageStatus,

    createdAt:
      toIsoString(
        data.created_at
      ),

    updatedAt:
      toIsoString(
        data.updated_at
      ),
  };
}

export async function getAdminContactMessages(
  options: {
    search?: string;
    status?: ContactMessageStatus | "";
  } = {}
): Promise<MessagesResponse> {
  const snapshot =
    await getDocs(
      collection(
        db,
        "contact_messages"
      )
    );

  let messages =
    snapshot.docs.map(
      (item) => {
        const full =
          mapMessage(
            item.id,
            item.data()
          );

        const preview =
          full.message.length > 120
            ? `${full.message.slice(
                0,
                120
              )}...`
            : full.message;

        return {
          id:
            full.id,

          fullName:
            full.fullName,

          email:
            full.email,

          phone:
            full.phone,

          subject:
            full.subject,

          messagePreview:
            preview,

          status:
            full.status,

          createdAt:
            full.createdAt,

          updatedAt:
            full.updatedAt,
        };
      }
    );

  if (
    options.status
  ) {
    messages =
      messages.filter(
        (message) =>
          message.status ===
          options.status
      );
  }

  if (
    options.search?.trim()
  ) {
    const search =
      options.search
        .trim()
        .toLowerCase();

    messages =
      messages.filter(
        (message) => {
          return [
            message.fullName,
            message.email,
            message.phone,
            message.subject,
            message.messagePreview,
          ].some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(
                  search
                )
          );
        }
      );
  }

  messages.sort(
    (a, b) =>
      new Date(
        b.createdAt || 0
      ).getTime() -
      new Date(
        a.createdAt || 0
      ).getTime()
  );

  return {
    messages,
  };
}

export async function getAdminContactMessage(
  messageId: string
): Promise<MessageResponse> {
  const snapshot =
    await getDoc(
      doc(
        db,
        "contact_messages",
        messageId
      )
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Contact message not found."
    );
  }

  return {
    message:
      mapMessage(
        snapshot.id,
        snapshot.data()
      ),
  };
}

export async function updateAdminContactMessageStatus(
  messageId: string,
  status: ContactMessageStatus
): Promise<MessageResponse> {
  const reference =
    doc(
      db,
      "contact_messages",
      messageId
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Contact message not found."
    );
  }

  await updateDoc(
    reference,
    {
      status,

      updated_at:
        serverTimestamp(),
    }
  );

  const updatedSnapshot =
    await getDoc(
      reference
    );

  return {
    message:
      mapMessage(
        updatedSnapshot.id,
        updatedSnapshot.data()!
      ),
  };
}