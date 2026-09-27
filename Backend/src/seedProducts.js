require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
    {
        id: 1,
        name: "Velocity Runner",
        price: 4999,
        category: "Footwear",
        image: "images/p1.jpg",
        tags: ["running", "performance"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 50
    },

    {
        id: 2,
        name: "Velocity Pro",
        price: 6999,
        category: "Footwear",
        image: "images/p2.jpg",
        tags: ["running", "performance"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 40
    },

    {
        id: 3,
        name: "Runfold Essential",
        price: 2999,
        category: "Footwear",
        image: "images/p3.jpg",
        tags: ["everyday", "essentials"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 60
    },

    {
        id: 4,
        name: "Motion Jacket",
        price: 5499,
        category: "Apparel",
        image: "images/app1.jpg",
        tags: ["street", "everyday"],
        sizes: [],
        stock: 30
    },

    {
        id: 5,
        name: "Performance Pack",
        price: 1999,
        category: "Footwear",
        image: "images/p5.jpg",
        tags: ["performance", "running"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 45
    },

    {
        id: 6,
        name: "Runner Bottle",
        price: 999,
        category: "Accessories",
        image: "images/acc1.jpg",
        tags: ["everyday", "essentials", "running"],
        sizes: [],
        stock: 100
    },

    {
        id: 7,
        name: "Runfold Essential",
        price: 2999,
        category: "Footwear",
        image: "images/p4.jpg",
        tags: ["everyday", "essentials"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 60
    },

    {
        id: 8,
        name: "Runfold Essential",
        price: 2999,
        category: "Footwear",
        image: "images/p6.jpg",
        tags: ["everyday", "essentials"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 60
    },

    {
        id: 9,
        name: "Runfold Essential",
        price: 2999,
        category: "Accessories",
        image: "images/acc2.jpg",
        tags: ["everyday", "essentials", "running"],
        sizes: [],
        stock: 100
    },

    {
        id: 10,
        name: "Runfold Essential",
        price: 2999,
        category: "Footwear",
        image: "images/p7.jpg",
        tags: ["everyday", "essentials"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 60
    },

    {
        id: 11,
        name: "Runfold Essential",
        price: 2999,
        category: "Footwear",
        image: "images/p8.jpg",
        tags: ["everyday", "essentials"],
        sizes: ["7", "8", "9", "10", "11"],
        stock: 60
    },

    {
        id: 12,
        name: "Runfold Essential",
        price: 2999,
        category: "apparel",
        image: "images/app2.jpg",
        tags: ["everyday", "essentials", "running"],
        sizes: [],
        stock: 30
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // Remove existing products before inserting the current catalogue 
        //so it will replace the old documents with the corrected ones.
        await Product.deleteMany({});

        await Product.insertMany(products);

        console.log("✅ Products inserted successfully");
        console.log(`✅ Total products: ${products.length}`);

        await mongoose.connection.close();

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedProducts(); 