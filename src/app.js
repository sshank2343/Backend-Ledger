const express = require('express');
const cookieParser = require('cookie-parser');


const authRoutes = require('./routes/auth.routes.js');
const accountRoutes = require('./routes/account.route.js');
const transactionRoutes = require('./routes/transaction.route.js');



const app = express();


app.use(express.json());
app.use(cookieParser());



app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);


module.exports = app;
