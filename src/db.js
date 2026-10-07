const { MongoClient } = require("mongodb");

const clientOptions = {
    family: 4,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
};

const readClient = new MongoClient(
    process.env.MONGO_READ_URI,
    clientOptions
);

const writeClient = new MongoClient(
    process.env.MONGO_WRITE_URI,
    clientOptions
);

let readBooks;
let writeBooks;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectWithRetry(client, label, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.connect();

            console.log(`✅ ${label} account connected`);
            return;
        } catch (error) {
            console.log(
                `⚠️ ${label} connection attempt ${attempt}/${maxRetries} failed`
            );

            if (attempt === maxRetries) {
                throw error;
            }

            await sleep(2000);
        }
    }
}

async function connectDatabase() {
    await connectWithRetry(
        readClient,
        "READ"
    );

    await connectWithRetry(
        writeClient,
        "WRITE"
    );

    const dbName = process.env.DB_NAME;

    readBooks = readClient
        .db(dbName)
        .collection("books");

    writeBooks = writeClient
        .db(dbName)
        .collection("books");
}

function getReadBooks() {
    return readBooks;
}

function getWriteBooks() {
    return writeBooks;
}

module.exports = {
    connectDatabase,
    getReadBooks,
    getWriteBooks
};