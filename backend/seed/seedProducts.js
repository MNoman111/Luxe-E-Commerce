import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Voucher from "../models/Voucher.js";

dotenv.config();

const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const vouchers = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    discountType: "percent",
    discountValue: 10,
    minOrder: 0,
    expiresAt: daysFromNow(60),
    usageLimit: 0,
    active: true,
  },
  {
    code: "SAVE20",
    description: "$20 off orders over $100",
    discountType: "fixed",
    discountValue: 20,
    minOrder: 100,
    expiresAt: daysFromNow(14),
    usageLimit: 100,
    active: true,
  },
  {
    code: "SUMMER25",
    description: "25% off — limited summer promo",
    discountType: "percent",
    discountValue: 25,
    minOrder: 80,
    expiresAt: daysFromNow(7),
    usageLimit: 50,
    active: true,
  },
  {
    code: "EXPIRED5",
    description: "Expired sample voucher (for testing the expiry check)",
    discountType: "percent",
    discountValue: 5,
    minOrder: 0,
    expiresAt: daysFromNow(-2),
    usageLimit: 0,
    active: true,
  },
];

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const products = [
  {
    name: "Essential Cotton Crew Tee",
    slug: "essential-cotton-crew-tee",
    category: "Men",
    description:
      "A wardrobe staple cut from 100% combed organic cotton. Soft, breathable and pre-shrunk for a lasting fit.",
    price: 28,
    image: img("1521572163474-6864f9cf17ab"),
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Sand"],
    countInStock: 60,
    rating: 4.6,
    numReviews: 42,
    featured: true,
  },
  {
    name: "Classic Denim Trucker Jacket",
    slug: "classic-denim-trucker-jacket",
    category: "Men",
    description:
      "Rigid 12oz denim trucker jacket with antique copper buttons. Ages beautifully with every wear.",
    price: 96,
    image: img("1576995853123-5a10305d93c0"),
    sizes: ["S", "M", "L", "XL"],
    colors: ["Indigo", "Washed Blue"],
    countInStock: 35,
    rating: 4.8,
    numReviews: 31,
    featured: true,
  },
  {
    name: "Heavyweight Fleece Hoodie",
    slug: "heavyweight-fleece-hoodie",
    category: "Men",
    description:
      "450gsm brushed-back fleece hoodie with a relaxed fit, double-lined hood and kangaroo pocket.",
    price: 64,
    image: img("1556821840-3a63f95609a7"),
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Charcoal", "Olive", "Cream"],
    countInStock: 48,
    rating: 4.7,
    numReviews: 58,
    featured: true,
  },
  {
    name: "Oxford Button-Down Shirt",
    slug: "oxford-button-down-shirt",
    category: "Men",
    description:
      "Tailored oxford shirt in breathable cotton. Versatile enough for the office or the weekend.",
    price: 58,
    image: img("1602810318383-e386cc2a3ccf"),
    sizes: ["S", "M", "L", "XL"],
    colors: ["Sky Blue", "White"],
    countInStock: 40,
    rating: 4.5,
    numReviews: 22,
  },
  {
    name: "Flowing Midi Wrap Dress",
    slug: "flowing-midi-wrap-dress",
    category: "Women",
    description:
      "An elegant wrap dress in fluid viscose with a flattering tie waist and midi length.",
    price: 89,
    image: img("1572804013309-59a88b7e92f1"),
    sizes: ["XS", "S", "M", "L"],
    colors: ["Terracotta", "Black"],
    countInStock: 30,
    rating: 4.9,
    numReviews: 47,
    featured: true,
  },
  {
    name: "Relaxed Linen Blouse",
    slug: "relaxed-linen-blouse",
    category: "Women",
    description:
      "Breezy 100% European linen blouse with a relaxed silhouette and mother-of-pearl buttons.",
    price: 72,
    image: img("1591047139829-d91aecb6caea"),
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Sage"],
    countInStock: 38,
    rating: 4.6,
    numReviews: 19,
    featured: true,
  },
  {
    name: "Tailored Wool Overcoat",
    slug: "tailored-wool-overcoat",
    category: "Women",
    description:
      "A timeless longline overcoat in an Italian wool blend with a clean, structured shoulder.",
    price: 189,
    image: img("1539533018447-63fcce2678e3"),
    sizes: ["XS", "S", "M", "L"],
    colors: ["Camel", "Grey"],
    countInStock: 18,
    rating: 4.8,
    numReviews: 12,
  },
  {
    name: "High-Rise Tailored Trousers",
    slug: "high-rise-tailored-trousers",
    category: "Women",
    description:
      "Sharp high-rise trousers with a pressed crease and a comfortable stretch-twill weave.",
    price: 78,
    image: img("1594633312681-425c7b97ccd1"),
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black", "Stone"],
    countInStock: 26,
    rating: 4.4,
    numReviews: 15,
  },
  {
    name: "Full-Grain Leather Tote",
    slug: "full-grain-leather-tote",
    category: "Accessories",
    description:
      "Handcrafted full-grain leather tote with a suede-lined interior and laptop sleeve.",
    price: 145,
    image: img("1584917865442-de89df76afd3"),
    sizes: ["One Size"],
    colors: ["Tan", "Black"],
    countInStock: 22,
    rating: 4.9,
    numReviews: 33,
    featured: true,
  },
  {
    name: "Acetate Sunglasses",
    slug: "acetate-sunglasses",
    category: "Accessories",
    description:
      "Hand-polished acetate frames with UV400 polarized lenses and a keyhole bridge.",
    price: 54,
    image: img("1511499767150-a48a237f0083"),
    sizes: ["One Size"],
    colors: ["Tortoise", "Black"],
    countInStock: 50,
    rating: 4.5,
    numReviews: 28,
  },
  {
    name: "Minimalist Automatic Watch",
    slug: "minimalist-automatic-watch",
    category: "Accessories",
    description:
      "A refined automatic watch with a sapphire crystal, exhibition caseback and milanese strap.",
    price: 168,
    image: img("1524592094714-0f0654e20314"),
    sizes: ["One Size"],
    colors: ["Silver", "Gold"],
    countInStock: 16,
    rating: 4.8,
    numReviews: 24,
    featured: true,
  },
  {
    name: "Merino Wool Scarf",
    slug: "merino-wool-scarf",
    category: "Accessories",
    description:
      "Soft, lightweight merino wool scarf woven in a subtle herringbone pattern.",
    price: 42,
    image: img("1601924994987-69e26d50dc26"),
    sizes: ["One Size"],
    colors: ["Oatmeal", "Navy"],
    countInStock: 44,
    rating: 4.6,
    numReviews: 17,
  },
  {
    name: "Low-Top Leather Sneakers",
    slug: "low-top-leather-sneakers",
    category: "Footwear",
    description:
      "Minimal low-top sneakers in premium leather with a cushioned ortholite footbed.",
    price: 110,
    image: img("1542291026-7eec264c27ff"),
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["White", "Black"],
    countInStock: 42,
    rating: 4.7,
    numReviews: 61,
    featured: true,
  },
  {
    name: "Suede Chelsea Boots",
    slug: "suede-chelsea-boots",
    category: "Footwear",
    description:
      "Classic Chelsea boots in soft suede with elastic side panels and a durable crepe sole.",
    price: 158,
    image: img("1608256246200-53e635b5b65f"),
    sizes: ["7", "8", "9", "10", "11"],
    colors: ["Sand", "Brown"],
    countInStock: 24,
    rating: 4.8,
    numReviews: 26,
  },
  {
    name: "Canvas Running Trainers",
    slug: "canvas-running-trainers",
    category: "Footwear",
    description:
      "Lightweight everyday trainers with a breathable knit upper and responsive foam midsole.",
    price: 92,
    image: img("1460353581641-37baddab0fa2"),
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["Grey", "Black"],
    countInStock: 36,
    rating: 4.4,
    numReviews: 39,
  },
  {
    name: "Ribbed Knit Beanie",
    slug: "ribbed-knit-beanie",
    category: "Accessories",
    description:
      "Cozy ribbed beanie in a recycled wool blend with a turn-up cuff.",
    price: 26,
    image: img("1576871337622-98d48d1cf531"),
    sizes: ["One Size"],
    colors: ["Black", "Mustard", "Grey"],
    countInStock: 70,
    rating: 4.5,
    numReviews: 18,
  },
];

const run = async () => {
  await connectDB();
  try {
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products.`);

    await Voucher.deleteMany();
    await Voucher.insertMany(vouchers);
    console.log(`Seeded ${vouchers.length} vouchers (try WELCOME10, SAVE20, SUMMER25).`);

    // Optional demo admin + customer accounts
    const adminEmail = "admin@luxe.test";
    if (!(await User.findOne({ email: adminEmail }))) {
      await User.create({
        name: "LUXE Admin",
        email: adminEmail,
        password: "admin123",
        isAdmin: true,
      });
      console.log("Created admin user -> admin@luxe.test / admin123");
    }
    const custEmail = "customer@luxe.test";
    if (!(await User.findOne({ email: custEmail }))) {
      await User.create({
        name: "Demo Customer",
        email: custEmail,
        password: "customer123",
      });
      console.log("Created customer user -> customer@luxe.test / customer123");
    }

    console.log("Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

run();
