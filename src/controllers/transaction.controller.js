const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

async function createTransactionController(req, res) {
  /**
   * -1 Validate request
   */

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      status: "fail",
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      status: "fail",
      message: "From account or to account not found",
    });
  }
  /**
   * 2. Validate idempotency key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });
  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        status: "success",
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        status: "success",
        message: "Transaction is being processed",
        transaction: isTransactionAlreadyExists,
      });
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        status: "fail",
        message:
          "Transaction failed previously, please try again with a new idempotency key",
        transaction: isTransactionAlreadyExists,
      });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        status: "fail",
        message:
          "Transaction was reversed previously, please try again with a new idempotency key",
        transaction: isTransactionAlreadyExists,
      });
    }
  }

  /**
   * 3. Check account status and balance
   */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      status: "fail",
      message: "From account or to account is not active",
    });
  }

  /**
   * 4. Derive sender balance from ledger
   */
  const balance = await fromUserAccount.getbalance();
  if (balance < amount) {
    return res.status(400).json({
      status: "fail",
      message: "Insufficient balance in from account",
    });
  }

  /**
   * 5. Create transaction with PENDING status
   */
  let transaction;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })();

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message:
        "Transaction is Pending due to some issue, please retry after sometime",
    });
  }

  /**
   * 10. Send email notifications to both parties (simulated)
   */
  await emailService.sendTransactionEmail(
    req.user.email,
    fromUserAccount.user,
    amount,
    toUserAccount.user,
  );
  return res.status(201).json({
    status: "success",
    message: "Transaction completed successfully",
    transaction,
  });
}

async function createInitialFundTransactionController(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      status: "fail",
      message: "toAccount, amount and idempotencyKey are required",
    });
  }
  const toUSerAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!toUSerAccount) {
    return res.status(404).json({
      status: "fail",
      message: "To account not found",
    });
  }
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(404).json({
      status: "fail",
      message: "System account not found",
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });
  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    status: "success",
    message: "Initial fund transaction completed successfully",
    transaction,
  });
}

module.exports = {
  createTransactionController,
  createInitialFundTransactionController,
};
