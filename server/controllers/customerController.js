const { Customer, Sale, CreditPayment, SaleItem, Product } = require('../models');

const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });

    const result = customers.map((c) => ({
      ...c.toJSON(),
      outstanding: parseFloat(c.totalCredit) - parseFloat(c.totalPaid),
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = await Customer.create({ name, phone });
    res.status(201).json({ ...customer.toJSON(), outstanding: 0 });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const creditSales = await Sale.findAll({
      where: { customerId: customer.id, paymentMethod: 'credit' },
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const payments = await CreditPayment.findAll({
      where: { customerId: customer.id },
      order: [['paidAt', 'DESC']],
    });

    res.json({
      ...customer.toJSON(),
      outstanding: parseFloat(customer.totalCredit) - parseFloat(customer.totalPaid),
      creditSales,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const { amountPaid, saleId } = req.body;
    const amount = parseFloat(amountPaid);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const outstanding = parseFloat(customer.totalCredit) - parseFloat(customer.totalPaid);
    if (amount > outstanding) {
      return res.status(400).json({ message: `Payment exceeds outstanding balance of PKR ${outstanding}` });
    }

    await CreditPayment.create({
      customerId: customer.id,
      saleId: saleId || null,
      amountPaid: amount,
      paidAt: new Date(),
    });

    const newTotalPaid = parseFloat(customer.totalPaid) + amount;
    await customer.update({ totalPaid: newTotalPaid });

    res.json({
      ...customer.toJSON(),
      totalPaid: newTotalPaid,
      outstanding: parseFloat(customer.totalCredit) - newTotalPaid,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, createCustomer, getCustomerById, recordPayment };
