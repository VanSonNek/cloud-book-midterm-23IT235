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

let readClientPromise = null;
let writeClientPromise = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectWithRetry(client, label, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.connect();

            console.log(`✅ ${label} account connected`);
            return client;

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

function getReadClientPromise() {
    if (!readClientPromise) {
        readClientPromise =
            connectWithRetry(readClient, "READ")
                .catch(error => {
                    readClientPromise = null;
                    throw error;
                });
    }

    return readClientPromise;
}

function getWriteClientPromise() {
    if (!writeClientPromise) {
        writeClientPromise =
            connectWithRetry(writeClient, "WRITE")
                .catch(error => {
                    writeClientPromise = null;
                    throw error;
                });
    }

    return writeClientPromise;
}

async function connectDatabase() {
    await getReadClientPromise();
    await getWriteClientPromise();

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
    getWriteBooks,
    getWriteClientPromise
};