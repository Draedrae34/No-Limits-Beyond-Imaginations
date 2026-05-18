import shopHandler from "./shop.js";

export default async function handler(req, res) {
  const printifyAction = req.query?.action || "status";
  req.query = {
    ...(req.query || {}),
    action: "printifyAdmin",
    printifyAction,
  };
  return shopHandler(req, res);
}
