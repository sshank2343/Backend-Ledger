const {Router} = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

const transactionRouter = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 * - Protected route
 */


transactionRouter.post("/",authMiddleware.authMiddleware,transactionController.createTransactionController)

/**
 * - POST /api/transactions/system/initial-funds
 */
transactionRouter.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundTransactionController)


module.exports = transactionRouter;