const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { sequelize, User, Supplier, Product, Customer, Sale, SaleItem, StoreSettings } = require('../models');

const suppliers = [
  { name: 'Engro Foods', phone: '042-111-364-111', email: 'orders@engrofoods.com', address: 'Lahore, Punjab' },
  { name: 'Unilever Pakistan', phone: '021-111-825-888', email: 'supply@unilever.pk', address: 'Karachi, Sindh' },
  { name: 'National Foods', phone: '042-111-624-111', email: 'info@nationalfoods.com', address: 'Lahore, Punjab' },
  { name: 'Shan Foods', phone: '042-111-742-626', email: 'sales@shanfoods.com', address: 'Karachi, Sindh' },
  { name: 'Coca-Cola Beverages', phone: '042-111-265-265', email: 'dist@coca-cola.pk', address: 'Lahore, Punjab' },
];

const products = [
  { name: 'Olper\'s Full Cream Milk 1L', category: 'Dairy', barcode: '8901000123456', unit: 'ltr', costPrice: 180, sellingPrice: 220, currentStock: 50, minStockThreshold: 10, supplierIdx: 0 },
  { name: 'Haleeb Milk 1L', category: 'Dairy', barcode: '8901000123457', unit: 'ltr', costPrice: 170, sellingPrice: 210, currentStock: 40, minStockThreshold: 10, supplierIdx: 0 },
  { name: 'Nestle Yogurt 400g', category: 'Dairy', barcode: '8901000123458', unit: 'pcs', costPrice: 120, sellingPrice: 150, currentStock: 30, minStockThreshold: 8, supplierIdx: 0 },
  { name: 'Adams Cheese Slices', category: 'Dairy', barcode: '8901000123459', unit: 'pcs', costPrice: 350, sellingPrice: 420, currentStock: 15, minStockThreshold: 5, supplierIdx: 0 },
  { name: 'Butter 200g', category: 'Dairy', barcode: '8901000123460', unit: 'pcs', costPrice: 280, sellingPrice: 340, currentStock: 20, minStockThreshold: 5, supplierIdx: 0 },
  { name: 'Coca-Cola 1.5L', category: 'Beverages', barcode: '8901000123461', unit: 'ltr', costPrice: 90, sellingPrice: 120, currentStock: 60, minStockThreshold: 15, supplierIdx: 4 },
  { name: 'Pepsi 1.5L', category: 'Beverages', barcode: '8901000123462', unit: 'ltr', costPrice: 85, sellingPrice: 115, currentStock: 55, minStockThreshold: 15, supplierIdx: 4 },
  { name: 'Nestle Pure Life 1.5L', category: 'Beverages', barcode: '8901000123463', unit: 'ltr', costPrice: 40, sellingPrice: 60, currentStock: 80, minStockThreshold: 20, supplierIdx: 4 },
  { name: 'Slice Mango 1L', category: 'Beverages', barcode: '8901000123464', unit: 'ltr', costPrice: 70, sellingPrice: 95, currentStock: 35, minStockThreshold: 10, supplierIdx: 4 },
  { name: 'Red Bull 250ml', category: 'Beverages', barcode: '8901000123465', unit: 'pcs', costPrice: 200, sellingPrice: 280, currentStock: 25, minStockThreshold: 8, supplierIdx: 4 },
  { name: 'Lays Masala 50g', category: 'Snacks', barcode: '8901000123466', unit: 'pcs', costPrice: 30, sellingPrice: 50, currentStock: 100, minStockThreshold: 20, supplierIdx: 1 },
  { name: 'Kurkure Masala Munch', category: 'Snacks', barcode: '8901000123467', unit: 'pcs', costPrice: 25, sellingPrice: 40, currentStock: 80, minStockThreshold: 15, supplierIdx: 1 },
  { name: 'Oreo Biscuits 120g', category: 'Snacks', barcode: '8901000123468', unit: 'pcs', costPrice: 80, sellingPrice: 110, currentStock: 45, minStockThreshold: 10, supplierIdx: 1 },
  { name: 'Bisconni Cocomo', category: 'Snacks', barcode: '8901000123469', unit: 'pcs', costPrice: 20, sellingPrice: 30, currentStock: 120, minStockThreshold: 25, supplierIdx: 1 },
  { name: 'Slanty Chatkhara', category: 'Snacks', barcode: '8901000123470', unit: 'pcs', costPrice: 15, sellingPrice: 25, currentStock: 90, minStockThreshold: 20, supplierIdx: 1 },
  { name: 'Surf Excel 1kg', category: 'Household', barcode: '8901000123471', unit: 'kg', costPrice: 350, sellingPrice: 420, currentStock: 25, minStockThreshold: 5, supplierIdx: 1 },
  { name: 'Harpic Toilet Cleaner', category: 'Household', barcode: '8901000123472', unit: 'pcs', costPrice: 180, sellingPrice: 230, currentStock: 18, minStockThreshold: 5, supplierIdx: 1 },
  { name: 'Vim Dishwash Bar', category: 'Household', barcode: '8901000123473', unit: 'pcs', costPrice: 35, sellingPrice: 50, currentStock: 40, minStockThreshold: 10, supplierIdx: 1 },
  { name: 'Dettol Antiseptic 500ml', category: 'Household', barcode: '8901000123474', unit: 'ltr', costPrice: 250, sellingPrice: 320, currentStock: 12, minStockThreshold: 4, supplierIdx: 1 },
  { name: 'Mortein Spray', category: 'Household', barcode: '8901000123475', unit: 'pcs', costPrice: 400, sellingPrice: 500, currentStock: 8, minStockThreshold: 3, supplierIdx: 1 },
  { name: 'Basmati Rice 5kg', category: 'Grains', barcode: '8901000123476', unit: 'kg', costPrice: 1200, sellingPrice: 1450, currentStock: 20, minStockThreshold: 5, supplierIdx: 2 },
  { name: 'Daal Masoor 1kg', category: 'Grains', barcode: '8901000123477', unit: 'kg', costPrice: 280, sellingPrice: 350, currentStock: 35, minStockThreshold: 8, supplierIdx: 2 },
  { name: 'Wheat Flour 10kg', category: 'Grains', barcode: '8901000123478', unit: 'kg', costPrice: 900, sellingPrice: 1100, currentStock: 15, minStockThreshold: 4, supplierIdx: 2 },
  { name: 'Shan Biryani Masala', category: 'Grains', barcode: '8901000123479', unit: 'pcs', costPrice: 45, sellingPrice: 65, currentStock: 60, minStockThreshold: 15, supplierIdx: 3 },
  { name: 'National Pickle 400g', category: 'Grains', barcode: '8901000123480', unit: 'pcs', costPrice: 120, sellingPrice: 160, currentStock: 22, minStockThreshold: 6, supplierIdx: 2 },
  { name: 'Lifebuoy Soap', category: 'Personal Care', barcode: '8901000123481', unit: 'pcs', costPrice: 55, sellingPrice: 75, currentStock: 50, minStockThreshold: 12, supplierIdx: 1 },
  { name: 'Colgate Toothpaste 100g', category: 'Personal Care', barcode: '8901000123482', unit: 'pcs', costPrice: 180, sellingPrice: 240, currentStock: 30, minStockThreshold: 8, supplierIdx: 1 },
  { name: 'Fair & Lovely 50g', category: 'Personal Care', barcode: '8901000123483', unit: 'pcs', costPrice: 120, sellingPrice: 160, currentStock: 18, minStockThreshold: 5, supplierIdx: 1 },
  { name: 'Head & Shoulders Shampoo', category: 'Personal Care', barcode: '8901000123484', unit: 'pcs', costPrice: 450, sellingPrice: 580, currentStock: 10, minStockThreshold: 3, supplierIdx: 1 },
  { name: 'Pantene Conditioner', category: 'Personal Care', barcode: '8901000123485', unit: 'pcs', costPrice: 380, sellingPrice: 490, currentStock: 8, minStockThreshold: 3, supplierIdx: 1 },
];

const customers = [
  { name: 'Ahmed Khan', phone: '0300-1234567' },
  { name: 'Fatima Bibi', phone: '0301-2345678' },
  { name: 'Hassan Ali', phone: '0302-3456789' },
  { name: 'Zainab Malik', phone: '0303-4567890' },
  { name: 'Bilal Ahmed', phone: '0304-5678901' },
  { name: 'Sana Tariq', phone: '0305-6789012' },
  { name: 'Usman Sheikh', phone: '0306-7890123' },
  { name: 'Ayesha Noor', phone: '0307-8901234' },
  { name: 'Imran Qureshi', phone: '0308-9012345' },
  { name: 'Nadia Hussain', phone: '0309-0123456' },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await sequelize.sync({ force: true });
    console.log('Database reset and synced');

    const ownerPassword = await bcrypt.hash('Admin@1234', 12);
    const cashierPassword = await bcrypt.hash('Cashier@1234', 12);

    const owner = await User.create({
      name: 'Store Owner',
      email: 'owner@smartkirana.pk',
      password: ownerPassword,
      role: 'owner',
    });

    const cashier = await User.create({
      name: 'Cashier One',
      email: 'cashier@smartkirana.pk',
      password: cashierPassword,
      role: 'cashier',
    });

    await StoreSettings.create({
      storeName: 'Smart Kirana',
      ownerName: 'Store Owner',
      ownerEmail: 'owner@smartkirana.pk',
    });

    const createdSuppliers = await Supplier.bulkCreate(suppliers);
    console.log(`Created ${createdSuppliers.length} suppliers`);

    const createdProducts = [];
    for (const p of products) {
      const { supplierIdx, ...data } = p;
      const product = await Product.create({
        ...data,
        supplierId: createdSuppliers[supplierIdx].id,
        expiryDate: p.category === 'Dairy' ? getFutureDate(5 + Math.floor(Math.random() * 20)) : null,
      });
      createdProducts.push(product);
    }
    console.log(`Created ${createdProducts.length} products`);

    const createdCustomers = await Customer.bulkCreate(customers);
    console.log(`Created ${createdCustomers.length} customers`);

    let invoiceCounter = 1;
    const salesData = [];

    for (let day = 60; day >= 0; day--) {
      const salesPerDay = 2 + Math.floor(Math.random() * 5);
      for (let s = 0; s < salesPerDay; s++) {
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - day);
        saleDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

        const itemCount = 1 + Math.floor(Math.random() * 5);
        const selectedProducts = [];
        for (let i = 0; i < itemCount; i++) {
          const prod = createdProducts[Math.floor(Math.random() * createdProducts.length)];
          if (!selectedProducts.find((sp) => sp.id === prod.id)) {
            selectedProducts.push(prod);
          }
        }

        let subtotal = 0;
        const items = selectedProducts.map((prod) => {
          const qty = 1 + Math.floor(Math.random() * 3);
          const price = parseFloat(prod.sellingPrice);
          const itemSub = qty * price;
          subtotal += itemSub;
          return { productId: prod.id, quantity: qty, unitPrice: price, subtotal: itemSub };
        });

        const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.05) : 0;
        const totalAmount = subtotal - discount;
        const isCredit = Math.random() > 0.75;
        const customer = isCredit ? createdCustomers[Math.floor(Math.random() * createdCustomers.length)] : null;

        const datePrefix = `${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}${String(saleDate.getDate()).padStart(2, '0')}`;
        const invoiceNumber = `INV-${datePrefix}-${String(invoiceCounter++).padStart(4, '0')}`;

        const sale = await Sale.create({
          invoiceNumber,
          totalAmount,
          discount,
          paymentMethod: isCredit ? 'credit' : 'cash',
          customerId: customer?.id || null,
          cashierId: Math.random() > 0.3 ? cashier.id : owner.id,
          createdAt: saleDate,
        });

        for (const item of items) {
          await SaleItem.create({ saleId: sale.id, ...item });
        }

        if (isCredit && customer) {
          await customer.update({
            totalCredit: parseFloat(customer.totalCredit) + totalAmount,
          });
        }

        salesData.push(sale);
      }
    }
    console.log(`Created ${salesData.length} historical sales`);

    for (const customer of createdCustomers.slice(0, 5)) {
      const credit = parseFloat(customer.totalCredit);
      if (credit > 0) {
        const paid = credit * (0.2 + Math.random() * 0.5);
        await customer.update({ totalPaid: paid });
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Owner:   owner@smartkirana.pk / Admin@1234');
    console.log('  Cashier: cashier@smartkirana.pk / Cashier@1234');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

seed();
