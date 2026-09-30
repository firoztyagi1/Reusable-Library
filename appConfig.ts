// @ts-nocheck
import dotenv from "dotenv";
import path from "path";
import { productionEnv } from "../constants/constants";

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
  throw new Error("NODE_ENV is not set. Please define it in your environment variables.");
}

const result = dotenv.config({
  path: path.resolve(__dirname, `../../${NODE_ENV === productionEnv ? "prod" : "dev"}.env`),
});

if (result.error) {
  throw new Error("Unable to locate the environment file.");
}

const requiredEnvVars = ["MONGODB_URI"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} is not set. Please define it in the environment.`);
  }
});

const appConfig = {
  environment: NODE_ENV,
  databaseUri: process.env.MONGODB_URI!,
};

export default appConfig;
