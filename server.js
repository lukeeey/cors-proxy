const express = require("express");
const nodeFetch = require("node-fetch");

const app = express();

app.use(express.json());

app.all("*", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        req.header("access-control-request-headers") || "*"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    const url = req.query.url;

    if (!url) {
        return res.status(400).json({
            error: "Missing 'url' query parameter"
        });
    }

    try {
        const headers = {
            ...req.headers,

            // Override these if you want to control them
            "user-agent":
                req.headers["user-agent"] ||
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
        };

        // Don't forward headers that belong to the proxy's connection
        delete headers.host;
        delete headers.connection;
        delete headers["content-length"];

        const response = await nodeFetch(url, {
            method: req.method,
            headers,
            body:
                !["GET", "HEAD"].includes(req.method)
                    ? JSON.stringify(req.body)
                    : undefined
        });

        const contentType = response.headers.get("content-type");

        // Pass response headers back to the client
        if (contentType) {
            res.setHeader("Content-Type", contentType);
        }

        const body = await response.text();

        try {
            return res.status(response.status).json(JSON.parse(body));
        } catch {
            return res.status(response.status).send(body);
        }
    } catch (e) {
        console.error("Failed to fetch from url:", e);

        return res.status(500).json({
            error: getErrorMessage(e)
        });
    }
});

const getErrorMessage = (e) => {
    if (e.type === "invalid-json") {
        return "The URL provided is not a JSON endpoint";
    }

    if (
        e?.code === "ENOTFOUND" ||
        e?.code === "ERR_INVALID_URL" ||
        e?.message?.includes("Only absolute URLs are supported")
    ) {
        return "The URL provided is invalid";
    }

    return "An error has occurred";
};

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Proxy server listening on port " + port);
});

module.exports = app;
