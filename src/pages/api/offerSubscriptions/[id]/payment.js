import {
  addOfferSubscriptionPayment,
  getOfferSubscriptionPayments,
  updateOfferSubscriptionPayment,
  deleteOfferSubscriptionPayment,
} from "../../../../../controllers/offerSubscriptionController";

const getErrorStatus = (error) => {
  const message = error.message || "";
  if (/not found/i.test(message)) return 404;
  if (/after this offer subscription has been used/i.test(message)) return 409;
  if (/Invalid|greater than zero|cannot exceed|payment method/i.test(message)) return 400;
  return 500;
};

export default async function handler(req, res) {
  const parsedID = Number(req.query.id);
  if (!Number.isInteger(parsedID) || parsedID <= 0) {
    return res.status(400).json({ message: "Invalid OfferSubscriptionID" });
  }

  // Each route uses the subscription ID in the URL to scope its payment records.
  if (req.method === "GET") {
    try {
      const payments = await getOfferSubscriptionPayments(parsedID);
      return res.status(200).json(payments);
    } catch (error) {
      console.error("GET offer subscription payments error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to load offer subscription payments" });
    }
  }

  if (req.method === "POST") {
    try {
      const { AmountPaid, PaymentMethod, UserID, PaymentDate, Notes } = req.body || {};
      if (AmountPaid === undefined || AmountPaid === null || AmountPaid === "") {
        return res.status(400).json({ message: "AmountPaid is required" });
      }
      if (!PaymentMethod) return res.status(400).json({ message: "PaymentMethod is required" });

      const result = await addOfferSubscriptionPayment(parsedID, { AmountPaid, PaymentMethod, UserID, PaymentDate, Notes });

      return res.status(201).json(result);

    } catch (error) {
      console.error("POST offer subscription payment error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to add offer subscription payment" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { OfferSubscriptionPaymentID, AmountPaid, PaymentMethod, Notes } = req.body || {};
      const result = await updateOfferSubscriptionPayment(parsedID, OfferSubscriptionPaymentID, { AmountPaid, PaymentMethod, Notes });
      return res.status(200).json(result);
    } catch (error) {
      console.error("PUT offer subscription payment error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to update offer subscription payment" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await deleteOfferSubscriptionPayment(parsedID, req.body?.OfferSubscriptionPaymentID);
      return res.status(200).json(result);
    } catch (error) {
      console.error("DELETE offer subscription payment error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to delete offer subscription payment" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
