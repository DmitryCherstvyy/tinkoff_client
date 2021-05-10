var express = require('express');
var path = require('path');
var logger = require('morgan');

const indexRouter = require('./routes/index');
const robots = require('./routes/robots');
const signalsExecutor = require('./routes/strategy_signal_execute');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/robots', robots.router);
app.use('/strategy_signal_execute', signalsExecutor);

module.exports = app;
