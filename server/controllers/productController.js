const { Op } = require('sequelize');
const { Product, Supplier } = require('../models');

const getProducts = async (req, res, next) => {
  try {
    const { category, supplierId, search, lowStock, expiring } = req.query;
    const where = { isDeleted: false };

    if (category) where.category = category;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }

    let products = await Product.findAll({
      where,
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });

    if (lowStock === 'true') {
      products = products.filter(
        (p) => parseFloat(p.currentStock) <= parseFloat(p.minStockThreshold)
      );
    }

    if (expiring === 'true') {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      const today = new Date().toISOString().split('T')[0];
      products = products.filter(
        (p) => p.expiryDate && p.expiryDate <= sevenDays.toISOString().split('T')[0] && p.expiryDate >= today
      );
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { isDeleted: false },
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
      order: [['currentStock', 'ASC']],
    });

    const lowStock = products.filter(
      (p) => parseFloat(p.currentStock) <= parseFloat(p.minStockThreshold) || p.reorderAlert
    );

    res.json(lowStock);
  } catch (error) {
    next(error);
  }
};

const getExpiring = async (req, res, next) => {
  try {
    const today = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);

    const products = await Product.findAll({
      where: {
        isDeleted: false,
        expiryDate: {
          [Op.between]: [today.toISOString().split('T')[0], sevenDays.toISOString().split('T')[0]],
        },
      },
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
      order: [['expiryDate', 'ASC']],
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

const getByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { barcode: req.params.code, isDeleted: false },
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    const full = await Product.findByPk(product.id, {
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });
    res.status(201).json(full);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.stockAdjustment !== undefined) {
      const adjustment = parseFloat(req.body.stockAdjustment);
      const newStock = parseFloat(product.currentStock) + adjustment;
      if (newStock < 0) {
        return res.status(400).json({ message: 'Stock cannot go negative' });
      }
      req.body.currentStock = newStock;
      delete req.body.stockAdjustment;
    }

    await product.update(req.body);
    const full = await Product.findByPk(product.id, {
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });
    res.json(full);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({ isDeleted: true });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getLowStock,
  getExpiring,
  getByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
};
