import { ACCEPTED_ORIGINS } from "../utils/origins.js";
export const optionsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin || "*");
        res.header("Access-Control-Allow-Methods", "GET, POST,PUT, DELETE, PATCH, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.sendStatus(200);
        return;
    }
    res.status(403).send(`Origin not allowed: ${origin}`);
};
