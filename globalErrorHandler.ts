// @ts-nocheck

import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import AppError from "../utils/AppError";
import mongoose from "mongoose";
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import multer from "multer";
import appConfig from "../config/appConfig";
import { developmentEnv } from "../constants/constants";

class AppError extends Error {
  statusCode: number;

  constructor(err: string, status: number) {
    super(err);
    this.message = err;
    this.statusCode = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (appConfig.environment === developmentEnv) {
    logger.info(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
    statusCode = 404;
    message = "Document not found";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err instanceof NotBeforeError) {
    statusCode = 401;
    message = "Token not active yet. Please check the issued time.";
  } else if (err instanceof multer.MulterError) {
    statusCode = Number(err.code) || 400;
    message = `${err.message} for ${err.field}`;
  } else if (err instanceof Error) {
    const mongoError = err as any;

    if (mongoError.name === "MongoServerError") {
      if (mongoError.code === 112) {
        statusCode = 409;
        message = "There was a conflict with another operation. Please try again.";
      } else if (mongoError.errorLabels?.includes("TransientTransactionError")) {
        statusCode = 503;
        message = "A temporary server issue occurred. Please try your request again shortly.";
      } else {
        statusCode = 400;
        message = mongoError.message || "A database error occurred.";
      }
    } else {
      statusCode = 400;
      message = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default globalErrorHandler;
