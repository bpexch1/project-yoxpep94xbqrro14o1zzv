// Purane dead client ko bypass kar ke direct application models export karna
export const User = {
  auth: {
    currentUser: () => {
      const data = localStorage.getItem("clientSession");
      return data ? JSON.parse(data) : null;
    }
  }
};

// Entities definitions jo views backup ke liye use kar rahe hain
export const Client = "Client";
export const Transaction = "Transaction";
export const Match = "Match";
export const Bet = "Bet";
