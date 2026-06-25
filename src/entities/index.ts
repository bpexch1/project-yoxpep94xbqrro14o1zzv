import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const createEntityHandler = (entityName: string) => {
  return {
    filter: async (query: any) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/${entityName}/filter`, query);
        return response.data;
      } catch (error) {
        console.error(`Error filtering ${entityName}:`, error);
        return [];
      }
    },
    findOne: async (query: any) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/${entityName}/find-one`, query);
        return response.data;
      } catch (error) {
        console.error(`Error findOne in ${entityName}:`, error);
        return null;
      }
    },
    create: async (data: any) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/${entityName}/create`, data);
        return response.data;
      } catch (error) {
        console.error(`Error creating ${entityName}:`, error);
        throw error;
      }
    },
    update: async (query: any, data: any) => {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/${entityName}/update`, { query, data });
        return response.data;
      } catch (error) {
        console.error(`Error updating ${entityName}:`, error);
        throw error;
      }
    }
  };
};

export const User = createEntityHandler("users");
export const Client = createEntityHandler("clients");
export const Transaction = createEntityHandler("transactions");
export const Match = createEntityHandler("matches");
export const Bet = createEntityHandler("bets");