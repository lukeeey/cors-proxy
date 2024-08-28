const express = require("express");
const nodeFetch = require("node-fetch");

const app = express();

app.all("*", async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header("access-control-request-headers"));

    if (req.method === "OPTIONS") {
        return res.end();
    }
    const url = req.query.url;

    if (!url) {
        return res.status(401).json({ error: "Missing 'url' query parameter" });
    }

    try {
        const response = await nodeFetch(url, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/536.32 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/528.36"
            },
            body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
        });
        
        const body = await response.json();
        return res.status(response.status).json(body);
    } catch (e) {
        console.error("Failed to fetch from url: " + e.message);
        return res.status(500).json({ error: getErrorMessage(e) });
    }
});

const getErrorMessage = (e) => {
    if (e.type === "invalid-json") {
        return "The URL provided is not a JSON endpoint";
    }
    if (e?.code === "ENOTFOUND" || e?.code === "ERR_INVALID_URL" || e.message.includes("Only absolute URLs are supported")) {
        return "The URL provided is invalid";
    }
    return "An error has occurred"
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Proxy server listening on port " + port);
});