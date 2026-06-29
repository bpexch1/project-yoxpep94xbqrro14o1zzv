import { core } from "@/integrations/core";

export const User = {
  auth: {
    currentUser: () => {
      const data = localStorage.getItem("clientSession");
      return data ? JSON.parse(data) : null;
    }
  }
};

export const Client = {
  list: (options?: any) => core.list("Client", options),
  filter: (query: any) => core.filter("Client", query)
};

export const Transaction = {
  list: (options?: any) => core.list("Transaction", options),
  filter: (query: any) => core.filter("Transaction", query)
};

export const Match = {
  list: (options?: any) => core.list("Match", options),
  filter: (query: any) => core.filter("Match", query)
};

export const Bet = {
  list: (options?: any) => core.list("Bet", options),
  filter: (query: any) => core.filter("Bet", query)
};