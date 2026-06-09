const { sequelize, Supplier, Product, PurchaseOrder } = require('../models');

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      include: [{ model: Product, as: 'products', where: { isDeleted: false }, required: false }],
      order: [['name', 'ASC']],
    });

    const result = suppliers.map((s) => ({
      ...s.toJSON(),
      productsSupplied: s.products?.length || 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'products', where: { isDeleted: false }, required: false },
        {
          model: PurchaseOrder,
          as: 'purchaseOrders',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
          order: [['orderedAt', 'DESC']],
        },
      ],
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { supplierId, productId, quantity, costPerUnit } = req.body;
    const qty = parseFloat(quantity);
    const cost = parseFloat(costPerUnit);

    if (!supplierId || !productId || !qty || !cost) {
      await transaction.rollback();
      return res.status(400).json({ message: 'All purchase fields are required' });
    }

    const product = await Product.findOne({
      where: { id: productId, isDeleted: false },
      transaction,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const totalCost = qty * cost;

    const order = await PurchaseOrder.create(
      {
        supplierId,
        productId,
        quantity: qty,
        costPerUnit: cost,
        totalCost,
        orderedAt: new Date(),
      },
      { transaction }
    );

    await product.update(
      {
        currentStock: parseFloat(product.currentStock) + qty,
        costPrice: cost,
      },
      { transaction }
    );

    await transaction.commit();

    const full = await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Product, as: 'product' },
      ],
    });

    res.status(201).json(full);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: Product, as: 'product', attributes: ['id', 'name'] },
      ],
      order: [['orderedAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierById,
  createPurchaseOrder,
  getPurchaseOrders,
};
