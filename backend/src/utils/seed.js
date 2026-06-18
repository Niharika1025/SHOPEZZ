import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const categoriesData = [
  { name: 'Electronics', description: 'Gadgets, phones, laptops, and more' },
  { name: 'Fashion', description: 'Trendy clothes, shoes, and accessories' },
  { name: 'Home Decor', description: 'Furniture, lights, and home decorations' },
  { name: 'Sports', description: 'Fitness gear, outdoor equipment, and clothing' }
];

const usersData = [
  {
    name: 'ShopEZ Admin',
    email: 'admin@shopez.com',
    password: 'admin123',
    role: 'admin',
    status: 'active'
  },
  {
    name: 'Alpha Seller',
    email: 'seller@shopez.com',
    password: 'seller123',
    role: 'seller',
    status: 'active'
  },
  {
    name: 'Beta Seller',
    email: 'seller2@shopez.com',
    password: 'seller123',
    role: 'seller',
    status: 'active'
  },
  {
    name: 'Jane Buyer',
    email: 'buyer@shopez.com',
    password: 'buyer123',
    role: 'buyer',
    status: 'active'
  },
  {
    name: 'John Buyer',
    email: 'buyer2@shopez.com',
    password: 'buyer123',
    role: 'buyer',
    status: 'active'
  }
];

const productsData = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'The latest Apple flagship smartphone with Titanium design, A17 Pro chip, and advanced camera system.',
    price: 1199.99,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'],
    categoryName: 'Electronics',
    sellerEmail: 'seller@shopez.com',
    status: 'approved'
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise-canceling wireless over-ear headphones with exceptional sound quality and comfort.',
    price: 399.99,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    categoryName: 'Electronics',
    sellerEmail: 'seller2@shopez.com',
    status: 'approved'
  },
  {
    name: 'Floral Silk Dress',
    description: 'Elegant summer dress made from 100% pure silk, featuring a beautiful floral pattern and relaxed fit.',
    price: 79.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
    categoryName: 'Fashion',
    sellerEmail: 'seller@shopez.com',
    status: 'approved'
  },
  {
    name: 'Classic Leather Jacket',
    description: 'Premium cowhide leather jacket with zip closure, polyester lining, and timeless rugged style.',
    price: 199.99,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
    categoryName: 'Fashion',
    sellerEmail: 'seller2@shopez.com',
    status: 'approved'
  },
  {
    name: 'Ceramic Flower Vase',
    description: 'Handcrafted minimalist ceramic vase, perfect for displaying dry or fresh flowers on tables or shelves.',
    price: 34.99,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800'],
    categoryName: 'Home Decor',
    sellerEmail: 'seller@shopez.com',
    status: 'approved'
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'High-back mesh office chair with lumbar support, adjustable 3D armrests, and dynamic tilt locking.',
    price: 249.99,
    stock: 10,
    images: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800'],
    categoryName: 'Home Decor',
    sellerEmail: 'seller2@shopez.com',
    status: 'approved'
  },
  {
    name: 'Eco-Friendly Yoga Mat',
    description: 'Non-slip 6mm TPE yoga mat with dual-layer alignment system lines and carrying strap included.',
    price: 24.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800'],
    categoryName: 'Sports',
    sellerEmail: 'seller@shopez.com',
    status: 'approved'
  },
  {
    name: 'Adjustable Dumbbell Set',
    description: 'Compact steel dumbbell set with quick dial adjustment, shifting weights from 5 lbs up to 52.5 lbs instantly.',
    price: 89.99,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800'],
    categoryName: 'Sports',
    sellerEmail: 'seller2@shopez.com',
    status: 'approved'
  }
];

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopez';
    console.log(`Connecting to database for seeding: ${connStr}`);
    await mongoose.connect(connStr);

    console.log('Clearing existing data collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('Collections cleared.');

    console.log('Seeding Users...');
    const createdUsers = [];
    for (const u of usersData) {
      // Create user to trigger pre-save password hooks
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users successfully.`);

    console.log('Seeding Categories...');
    const createdCategories = [];
    for (const c of categoriesData) {
      const category = await Category.create(c);
      createdCategories.push(category);
    }
    console.log(`Seeded ${createdCategories.length} categories successfully.`);

    console.log('Seeding Products...');
    const seededProducts = [];
    for (const p of productsData) {
      const categoryObj = createdCategories.find(c => c.name === p.categoryName);
      const sellerObj = createdUsers.find(u => u.email === p.sellerEmail);

      if (categoryObj && sellerObj) {
        const product = await Product.create({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          images: p.images,
          category: categoryObj._id,
          seller: sellerObj._id,
          status: p.status
        });
        seededProducts.push(product);
      }
    }
    console.log(`Seeded ${seededProducts.length} products successfully.`);

    console.log('Seeding Reviews & Audit Logs...');
    const buyerObj1 = createdUsers.find(u => u.email === 'buyer@shopez.com');
    const buyerObj2 = createdUsers.find(u => u.email === 'buyer2@shopez.com');

    // Add some reviews to get average ratings populated
    if (buyerObj1 && buyerObj2 && seededProducts.length > 0) {
      // Review 1: iPhone
      const iphone = seededProducts.find(p => p.name === 'iPhone 15 Pro Max');
      if (iphone) {
        await Review.create({
          product: iphone._id,
          user: buyerObj1._id,
          rating: 5,
          comment: 'Absolutely amazing smartphone! Best camera quality.'
        });
      }

      // Review 2: Sony Headphones
      const sony = seededProducts.find(p => p.name === 'Sony WH-1000XM5');
      if (sony) {
        await Review.create({
          product: sony._id,
          user: buyerObj2._id,
          rating: 4,
          comment: 'Sound quality is superb, but the case is slightly bulky.'
        });
      }

      // Review 3: Yoga Mat
      const yoga = seededProducts.find(p => p.name === 'Eco-Friendly Yoga Mat');
      if (yoga) {
        await Review.create({
          product: yoga._id,
          user: buyerObj1._id,
          rating: 5,
          comment: 'Great quality, non-slip, and eco friendly. Highly recommend!'
        });
      }

      // Review 4: Dumbbells
      const db = seededProducts.find(p => p.name === 'Adjustable Dumbbell Set');
      if (db) {
        await Review.create({
          product: db._id,
          user: buyerObj2._id,
          rating: 4,
          comment: 'Very convenient and space-saving, build quality is fine.'
        });
      }

      // Audit Log
      await AuditLog.create({
        action: 'SYSTEM_SEED',
        details: { message: 'Database seeded with default testing catalog.' },
        ipAddress: '127.0.0.1'
      });
    }
   console.log('Seeding process completed successfully!');
return true;
} catch (error) {
  console.error(`Seeding failed with error: ${error.message}`);
  throw error;
}};

export default seedDB;
