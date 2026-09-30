// @ts-nocheck

import appConfig from "./appConfig";
import { developmentEnv } from "../constants/constants";

const maxRetries = 3;
const retryDelayMs = 2000;

const sendEmail = async (to: string, name: string, email: string, password: string) => {
  try {
    const mailOptions = {
      to: [{ email: to }],
      templateId: parseInt(appConfig.templateID, 10),
      params: { name, email, password },
    };

    let lastError;

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

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Brevo API responded with status ${response.status}: ${text}`);
        }

        break;
      } catch (err) {
        lastError = err;

        console.warn(`[Email] Attempt ${attempt}/${maxRetries} failed: ${err.message}`);

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
      }
    }

    throw lastError;
  } catch (err) {
    console.error("[Email] Failed to send email:", err.message);

    if (process.env.NODE_ENV === developmentEnv) {
      console.error(err.stack);
    }
  }
};

export { sendEmail };
