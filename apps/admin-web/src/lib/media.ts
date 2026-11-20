import { apiRequest } from "./api";

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export const uploadMediaFile = async (file: File, token: string, kind: "products" | "categories" = "products") => {
  const { data } = await apiRequest<UploadSignature>("/admin/media/signature", {
    method: "POST",
    body: JSON.stringify({ kind })
  }, token);
  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", data.apiKey);
  formData.set("timestamp", String(data.timestamp));
  formData.set("folder", data.folder);
  formData.set("signature", data.signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`, {
    method: "POST",
    body: formData
  });
  const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Could not upload ${file.name}`);
  }
  return result.secure_url;
};
