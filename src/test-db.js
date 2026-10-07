require("dotenv").config();

const {
    connectDatabase
} = require("./db");

async function testConnection() {
    try {
        await connectDatabase();

        console.log(
            "✅ Kết nối đồng thời 2 tài khoản thành công!"
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "❌ Lỗi kết nối:",
            error.message
        );

        process.exit(1);
    }
}

testConnection();