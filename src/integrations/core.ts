import { superdevClient } from "../lib/superdev/client";

export const core = superdevClient.integrations.core;
export const uploadFile = superdevClient.integrations.core.uploadFile;
export const invokeLLM = superdevClient.integrations.core.invokeLLM;
export const generateImage = superdevClient.integrations.core.generateImage;
export const getUploadedFile = superdevClient.integrations.core.getUploadedFile;
export const sendEmail = superdevClient.integrations.core.sendEmail;
export const extractDataFromUploadedFile =
  superdevClient.integrations.core.extractDataFromUploadedFile;
