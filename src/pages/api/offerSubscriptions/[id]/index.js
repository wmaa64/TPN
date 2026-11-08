import {
  getOfferSubscriptionById,
  updateOfferSubscription,
  deleteOfferSubscription,
} from "../../../../../controllers/offerSubscriptionControllerOld";

const getErrorStatus = (error) => {
  const message = error.message || "";
  if (/not found/i.test(message)) return 404;
  if (/already been used|payment history|payment has been recorded|already has an active subscription/i.test(message)) return 409;
  if (/invalid/i.test(message)) return 400;
  return 500;
};

export default async function handler(req, res) {
  const parsedID = Number(req.query.id);
  if (!Number.isInteger(parsedID) || parsedID <= 0) {
    return res.status(400).json({ message: "Invalid OfferSubscriptionID" });
  }

  if (req.method === "GET") {
    try {
      const subscription = await getOfferSubscriptionById(parsedID);
      if (!subscription) return res.status(404).json({ message: "Offer subscription not found" });
      return res.status(200).json(subscription);
    } catch (error) {
      console.error("GET offer subscription error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to load offer subscription" });
    }
  }

  if (req.method === "PUT") {
    try {
      const subscription = await updateOfferSubscription(parsedID, req.body || {});
      return res.status(200).json(subscription);
    } catch (error) {
      console.error("PUT offer subscription error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to update offer subscription" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await deleteOfferSubscription(parsedID);
      return res.status(200).json({ message: "Offer subscription deleted", ...result });
    } catch (error) {
      console.error("DELETE offer subscription error:", error);
      return res.status(getErrorStatus(error)).json({ message: error.message || "Failed to delete offer subscription" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
