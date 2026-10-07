const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const {
    getWriteClientPromise
} = require("./db");

function createSessionMiddleware() {
    return session({
        secret: process.env.SESSION_SECRET,

        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            clientPromise: getWriteClientPromise(),

            dbName: process.env.DB_NAME,
            collectionName: "sessions",

            autoRemove: "interval",
            autoRemoveInterval: 10
        }),

        cookie: {
            httpOnly: true,
            sameSite: "lax",

            secure:
                process.env.NODE_ENV === "production",

            maxAge: 60 * 60 * 1000
        }
    });
}

module.exports = createSessionMiddleware;