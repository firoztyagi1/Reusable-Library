// @ts-nocheck
// Disable TypeScript checking for this file (not recommended long-term)
// but useful when using incompatible or loosely typed modules.

import mongoose from "mongoose"; // Mongoose ORM for managing MongoDB connections.
import appConfig from "./appConfig"; // App-level configuration (DB name, URI, environment, etc.).
import { developmentEnv, MAX_RETRIES, RETRY_DELAY } from "../constants/constants";
// Constants controlling retry behavior and environment checks.

import logger from "../utils/logger"; // Centralized logger utility.

// -----------------------------------------------------------------------------
// Utility: delay
// Creates a Promise-based delay used between retry attempts.
// -----------------------------------------------------------------------------
const delay = (ms: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

// -----------------------------------------------------------------------------
// Main: connectToDatabase
// Attempts to connect to MongoDB using mongoose.connect().
// Implements retry logic with MAX_RETRIES and RETRY_DELAY.
// -----------------------------------------------------------------------------
const connectToDatabase = async (retries = 1) => {
  try {
    // Build connection options. autoIndex is enabled only in development for performance reasons.
    const options = {
      dbName: appConfig.dbName,
      autoIndex: appConfig.environment === developmentEnv ? true : false,
    };

    // Attempt connection.
    await mongoose.connect(appConfig.databaseUri, options);
    logger.info(`Connected to database successfully ${process.env.NODE_ENV}`);
  } catch (err) {
    // Increment retry count.
    const attempt = retries + 1;

    // If max retries reached, log error and exit the application.
    if (attempt >= MAX_RETRIES) {
      logger.error(`Unable to connect to DB after ${MAX_RETRIES} retries - ERR: ${err}`);
      process.exit(1);
    }

    // Wait before retrying.
    await delay(RETRY_DELAY);

    // Recursively attempt connecting again.
    await connectToDatabase(attempt);

    // Log success for a retry attempt (note: this logs AFTER a successful recursive call).
    logger.info("Connected to database successfully");
  }
};

export default connectToDatabase; // Export the function for use in the server startup.
