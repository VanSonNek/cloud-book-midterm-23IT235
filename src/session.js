const session = require("express-session");
const { MongoStore } = require("connect-mongo");

function createSessionMiddleware() {
    return session({
        secret: process.env.SESSION_SECRET,

        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_WRITE_URI,
            dbName: process.env.DB_NAME,
            collectionName: "sessions",

            mongoOptions: {
                family: 4,
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000
            },

            // Không tạo TTL index
            autoRemove: "interval",

            // Cứ 10 phút kiểm tra session hết hạn
            autoRemoveInterval: 10
        }),

        cookie: {
            httpOnly: true,
            sameSite: "lax",
           secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 1000
        }
    });
}

module.exports = createSessionMiddleware;