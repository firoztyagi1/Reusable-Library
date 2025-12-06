// @ts-nocheck

import appConfig from "./appConfig";
const maxRetries = 3, // Maximum number of retry attempts for sending an email
  retryDelayMs = 2000; // Base delay (ms) for retry backoff
import { developmentEnv } from "../constants/constants";

const sendEmail = async (to: string, name: string, email: string, password: string) => {
  try {
    // Construct email payload expected by Brevo API
    const mailOptions = {
      to: [{ email: to }],
      templateId: parseInt(appConfig.templateID, 10),
      params: { name, email, password }, // Template variables
    };

    let lastError;

    // Retry loop with exponential delay
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(appConfig.brevoURL, {
          method: "POST",
          headers: {
            "api-key": appConfig.brevoAPIKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mailOptions),
        });

        // If API responds with non-200 status, treat it as a failure
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Brevo API responded with status ${response.status}: ${text}`);
        }

        // Success → exit retry loop
        break;
      } catch (err) {
        lastError = err;

        console.warn(`[Email] Attempt ${attempt}/${maxRetries} failed: ${err.message}`);

        // Apply exponential backoff before retry (except after last attempt)
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
      }
    }

    // After exhausting retries, throw the final error
    throw lastError;
  } catch (err) {
    console.error("[Email] Failed to send email:", err.message);

    // Print stacktrace only in development mode
    if (process.env.NODE_ENV === developmentEnv) {
      console.error(err.stack);
    }
  }
};

export { sendEmail };
