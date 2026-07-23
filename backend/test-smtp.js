import "dotenv/config";

import {
  verifyMailerConnection,
} from "./src/config/mailer.js";

try {
  await verifyMailerConnection();

  console.log("SMTP connection is ready.");

  process.exit(0);
} catch (error) {
  console.error("SMTP verification failed:", {
    code: error?.code,
    command: error?.command,
    response: error?.response,
    message: error?.message,
  });

  process.exit(1);
}