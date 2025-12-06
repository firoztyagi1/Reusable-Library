// @ts-nocheck

import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import AppError from "../utils/AppError";
import mongoose from "mongoose";
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import multer from "multer";
import appConfig from "../config/appConfig";
import { developmentEnv } from "../constants/constants";

/**
 * Custom application error class
 * Used to throw meaningful errors with HTTP status codes
 */
class AppError extends Error {
  statusCode: number;

  constructor(err: string, status: number) {
    super(err);
    this.message = err;
    this.statusCode = status;

    // Capture stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Ensure instanceof checks work correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global Express error-handler middleware.
 * Catches and formats all errors thrown in the application.
 *
 * - Handles AppError (custom application errors)
 * - Handles Mongoose validation & cast errors
 * - Handles JWT authentication errors
 * - Handles Multer file upload errors
 * - Handles MongoDB server errors (transaction conflicts, etc.)
 * - Fallback for generic errors
 */
const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Log error details in development mode only
  if (appConfig.environment === developmentEnv) {
    logger.info(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";

  // Custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

  // Mongoose ValidationError (schema validation issues)
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");

  // Mongoose CastError (e.g., invalid ObjectId)
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;

  // Document not found when using .orFail()
  } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
    statusCode = 404;
    message = "Document not found";

  // JSON Web Token errors (invalid, expired, not active yet)
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err instanceof NotBeforeError) {
    statusCode = 401;
    message = "Token not active yet. Please check the issued time.";

  // Multer file upload errors
  } else if (err instanceof multer.MulterError) {
    statusCode = Number(err.code) || 400;
    message = `${err.message} for ${err.field}`;

  // Handle other Error instances
  } else if (err instanceof Error) {
    const mongoError = err as any;

    // MongoDB Server Errors (transaction & conflict errors)
    if (mongoError.name === "MongoServerError") {
      if (mongoError.code === 112) {
        statusCode = 409;
        message = "There was a conflict with another operation. Please try again.";
      } else if (mongoError.errorLabels?.includes("TransientTransactionError")) {
        statusCode = 503;
        message = "A temporary server issue occurred. Please try your request again shortly.";
      } else {
        // Catch-all for other MongoDB errors
        statusCode = 400;
        message = mongoError.message || "A database error occurred.";
      }
    } else {
      // Generic fallback for standard errors
      statusCode = 400;
      message = err.message;
    }
  }

  // Final formatted response
  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default globalErrorHandler;
