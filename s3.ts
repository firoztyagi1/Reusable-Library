// @ts-nocheck
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import appConfig from "../config/appConfig";
import AppError from "../utils/AppError";
import { s3Bucket } from "../config/s3";
import { base64ToBuffer } from "../utils/helper";
import { S3FoldersType } from "../constants/enums";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const uploadFileToS3 = async (file: string, folder: S3FoldersType) => {
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

export const deleteAFileFromS3 = async (key: string | undefined) => {
  if (!key) return;

  const params = {
    Bucket: appConfig.awsBucketName,
    Key: key,
  };

  await s3Bucket.send(new DeleteObjectCommand(params));
};

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
