// @ts-nocheck
// ----------------------------------------------------------------------

// Import dotenv to load environment variables from .env files
import dotenv from "dotenv";
// Import path to resolve file paths dynamically
import path from "path";

// Import constant value for production environment comparison
import { productionEnv } from "../constants/constants";

// Retrieve the current Node.js environment mode (e.g., development, production)
const NODE_ENV = process.env.NODE_ENV;

// Validate that NODE_ENV is set, otherwise terminate the process
if (!NODE_ENV) {
  throw new Error("NODE_ENV is not set. Please define it in your environment variables.");
  process.exit(1); // This line is unreachable due to the error above but is here as a fallback
}

// Load the appropriate .env file based on the NODE_ENV value
const result = dotenv.config({
  path: path.resolve(
    __dirname,
    `../../${NODE_ENV === productionEnv ? "prod" : "dev"}.env` // Use prod.env or dev.env accordingly
  ),
});

// Throw an error if dotenv failed to load the environment file
if (result.error) {
  throw new Error("Unable to locate the environment file.");
  process.exit(1); // Exit to prevent application from running with missing config
}

// Define the list of required environment variables
const requiredEnvVars = ["MONGODB_URI"];

// Ensure that all required environment variables are set
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} is not set. Please define it in the environment.`);
    process.exit(1); // Exit if a required variable is missing
  }
});

// Construct the application configuration object from validated environment variables
const appConfig = {
  environment: NODE_ENV,
  databaseUri: process.env.MONGODB_URI!, // Non-null assertion since it's already validated
};

// Export the app configuration for use throughout the application
export default appConfig;
