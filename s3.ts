// @ts-nocheck
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import appConfig from "../config/appConfig";
import AppError from "../utils/AppError";
import { s3Bucket } from "../config/s3";
import { base64ToBuffer } from "../utils/helper";
import { S3FoldersType } from "../constants/enums";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Uploads a Base64 file to S3 and organizes it inside a specific folder.
 * Converts Base64 → Buffer before upload.
 *
 * @param file - Base64 encoded file string
 * @param folder - Enum-based S3 folder name
 * @returns S3 object key
 */
export const uploadFileToS3 = async (file: string, folder: S3FoldersType) => {
  // Convert Base64 to binary data + metadata
  const { buffer, fileName, mimeType } = base64ToBuffer(file);

  const key = `${folder}/${fileName}`;

  const params = {
    Bucket: appConfig.awsBucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  try {
    await s3Bucket.send(new PutObjectCommand(params));
    return key;
  } catch (error) {
    console.log("Not able to upload file to S3:", error);
    throw new AppError("Not able to upload file to S3", 400);
  }
};

/**
 * Deletes a file from S3 using its object key.
 * If no key is provided, function silently returns.
 *
 * @param key - S3 object key
 */
export const deleteAFileFromS3 = async (key: string | undefined) => {
  if (!key) return;

  const params = {
    Bucket: appConfig.awsBucketName,
    Key: key,
  };

  await s3Bucket.send(new DeleteObjectCommand(params));
};

/**
 * Generates a pre-signed URL for downloading a file from S3.
 * Useful for secure access to private files.
 *
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns signed URL string
 */
export const generateSignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  if (!key) {
    return "";
  }

  const command = new GetObjectCommand({
    Bucket: appConfig.awsBucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Bucket, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
};
