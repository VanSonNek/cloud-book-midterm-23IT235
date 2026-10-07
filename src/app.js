require("dotenv").config();
const createSessionMiddleware =
    require("./session");

const express = require("express");
const { engine } = require("express-handlebars");

const {
    connectDatabase,
    getReadBooks,
    getWriteBooks
} = require("./db");

const app = express();
app.set("trust proxy", 1);

app.engine(
    "hbs",
    engine({
        extname: ".hbs"
    })
);

app.set("view engine", "hbs");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    createSessionMiddleware()
);
const MSSV = process.env.MSSV;

// 3 số cuối MSSV = 235
const PRODUCT_PREFIX = MSSV.slice(-3);

// Chữ số cuối MSSV = 5
const LAST_DIGIT = Number(MSSV.slice(-1));

// Theo đề mới: VAT = chữ số cuối + 6
const VAT_RATE = LAST_DIGIT + 6;
app.get("/", async (req, res) => {
    try {
        // GET phải dùng tài khoản READ
        const booksCollection = getReadBooks();

        const books = await booksCollection
            .find({})
            .toArray();

        res.render("home", {
            books,
            fullName: process.env.FULL_NAME,
            mssv: MSSV,
            prefix: PRODUCT_PREFIX,
            vatRate: VAT_RATE
        });
    } catch (error) {
        console.error("READ ERROR:", error.message);

        res.status(500).send(
            "Không thể đọc danh sách sách"
        );
    }
});
app.post("/books", async (req, res) => {
    try {
        const productCode =
            String(req.body.productCode || "").trim();

        const name =
            String(req.body.name || "").trim();

        const price =
            Number(req.body.price);

        // Kiểm tra tiền tố MSSV
        if (!productCode.startsWith(PRODUCT_PREFIX)) {
            return res.status(400).send(
                `Mã sản phẩm phải bắt đầu bằng ${PRODUCT_PREFIX}`
            );
        }

        if (!name) {
            return res.status(400).send(
                "Tên sách không được để trống"
            );
        }

        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).send(
                "Giá không hợp lệ"
            );
        }

        // Tính giá sau VAT
        const priceAfterVAT =
            Math.round(
                price * (1 + VAT_RATE / 100)
            );

        const newBook = {
            productCode,
            name,
            price,
            vat: VAT_RATE,
            priceAfterVAT
        };

        // POST phải dùng tài khoản WRITE
        const booksCollection = getWriteBooks();

        await booksCollection.insertOne(newBook);

        res.redirect("/");
    } catch (error) {
        console.error("WRITE ERROR:", error.message);

        res.status(500).send(
            "Không thể thêm sách"
        );
    }
});
const PORT = process.env.PORT || 3000;
app.get("/session-test", (req, res) => {
    req.session.views =
        (req.session.views || 0) + 1;

    res.send(
        `Session đang lưu trên MongoDB Atlas - Số lần truy cập: ${req.session.views}`
    );
});
async function startServer() {
    try {
        await connectDatabase();

      app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `✅ Server đang chạy trên port ${PORT}`
    );
});
    } catch (error) {
        console.error(
            "❌ Không thể khởi động server:",
            error.message
        );
    }
}

startServer();