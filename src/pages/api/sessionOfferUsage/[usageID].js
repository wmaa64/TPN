import {
  deleteOfferSubscriptionUsage,
  updateOfferSubscriptionUsage,
} from "../../../../controllers/offerSubscriptionControllerOld";

const getErrorStatus = (error) => {
  const message = error.message || "";

  if (/not found/i.test(message)) return 404;
  if (/balance|already uses a different offer subscription/i.test(message)) return 409;
  if (/invalid|greater than zero/i.test(message)) return 400;

  return 500;
};

// Edit or remove one usage row and keep the subscription balance in sync.
export default async function handler(req, res) {
  const usageID = Number(req.query.usageID);

  if (!Number.isInteger(usageID) || usageID <= 0) {
    return res.status(400).json({ message: "Invalid OfferSubscriptionUsageID" });
  }

  try {
    if (req.method === "PUT") {
      const result = await updateOfferSubscriptionUsage(usageID, req.body || {});
      return res.status(200).json(result);
    }

    if (req.method === "DELETE") {
      const result = await deleteOfferSubscriptionUsage(usageID);
      return res.status(200).json(result);
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error(`${req.method} session offer usage error:`, error);
    return res.status(getErrorStatus(error)).json({
      message: error.message || "Failed to update session offer usage",
    });
  }
}
