import axios from "axios";

// Aapke Node.js backend ka base URL (agar local hai to http://localhost:5000 ya jo bhi port hai)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Custom local object jo SuperdevClient ki jagah aapke Node.js endpoints ko hit karega
export const core = {
  filter: async (entityName: string, query: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/entities/filter`, { entityName, query });
      return response.data;
    } catch (error) {
      console.error("Entity filtering error:", error);
      return [];
    }
  },
  list: async (entityName: string, options?: any) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/entities/list/${entityName}`);
      return response.data;
    } catch (error) {
      console.error("Entity list error:", error);
      return [];
    }
  }
};

// 1. File Upload endpoint (Multer/Node.js custom handler)
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// 2. Ollama ya custom AI LLM connection endpoint
export const invokeLLM = async (prompt: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/ai/llm`, { prompt });
  return response.data;
};

// 3. Image Generation Integration (Promotional banners backend)
export const generateImage = async (prompt: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/ai/generate-image`, { prompt });
  return response.data;
};

export const getUploadedFile = async (fileId: string) => {
  const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}`);
  return response.data;
};

export const sendEmail = async (emailData: any) => {
  const response = await axios.post(`${API_BASE_URL}/api/mail/send`, emailData);
  return response.data;
};

export const extractDataFromUploadedFile = async (fileId: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/files/extract`, { fileId });
  return response.data;
};
