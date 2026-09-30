// @ts-nocheck
import mongoose from "mongoose";
import appConfig from "./appConfig";
import { developmentEnv, MAX_RETRIES, RETRY_DELAY } from "../constants/constants";
import logger from "../utils/logger";

const delay = (ms: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

const connectToDatabase = async (retries = 1) => {
  try {
    const options = {
      dbName: appConfig.dbName,
      autoIndex: appConfig.environment === developmentEnv ? true : false,
    };

    await mongoose.connect(appConfig.databaseUri, options);
    logger.info(`Connected to database successfully ${process.env.NODE_ENV}`);
  } catch (err) {
    const attempt = retries + 1;

    if (attempt >= MAX_RETRIES) {
      logger.error(`Unable to connect to DB after ${MAX_RETRIES} retries - ERR: ${err}`);
      process.exit(1);
    }

    await delay(RETRY_DELAY);
    await connectToDatabase(attempt);
    logger.info("Connected to database successfully");
  }
};

export default connectToDatabase;
