import {tr_robots_jsn_db_pr} from "./robots";

var express = require('express');
var router = express.Router();

import OpenAPI from '@tinkoff/invest-openapi-js-sdk';

const useSandbox = true;

const socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';
const secretToken = 'xxx'; // токен для сандбокса
const api = new OpenAPI({ apiURL, secretToken, socketURL });


router.post('/strategy_signal_execute', async (req, res) =>
{
    const body =await  req.body.json();


    const tiker = body["tikr"];
    const order = body["order"];
    const count = parseInt(body["pC"]);
    const signal_price_Close = body["pR"];

    const robot = (await tr_robots_jsn_db_pr()).find(t => t["tiker"] === tiker);

    const apiURL = robot["useSandbox"]?'https://api-invest.tinkoff.ru/openapi/sandbox':"https://api-invest.tinkoff.ru/openapi"; // Для Production-окружения будет https://api-invest.tinkoff.ru/openapi



    const { figi } = await api.searchOne({ ticker:tiker});

        //const { commission, orderId } = await api.limitOrder({
     //       operation: 'Buy',
     //       figi:figi,
     //       lots: 1,
     //       price: 100,
   //     }); // Покупаем AAPL

    const [bids,asks] = (await api.orderbookGet({figi: figi, depth: 1}));
    console.log(bids[0].quantity)
    console.log(asks[0].quantity)

   // const maxPositionSize = Math.min(count,(order==="buy"?bids[0]:asks[0]).quantity);


    const tOrder = await api.marketOrder({
        operation: order==="buy"?"Buy":"Sell",
        figi:figi,
        lots: count//maxPositionSize,
    });

    //const priceAfterBuy = api.operations()[0].
    // Покупаем
    console.log(tOrder.commission); // Комиссия за сделку
    setTimeout(()=>DelayedCancel(tOrder),30000)
    async function DelayedCancel(tOrder)
    {
        if(tOrder.executedLots === tOrder.executedLots) {
            await api.cancelOrder({orderId: tOrder.orderId});
            console.log("order canceled dye to unfilled")
            console.dir(tOrder)
        }
        else{
            const balanceBefore =robot["tradingDeals"].length>0?calcTradesProfit(robot["tradingDeals"],parseInt(robot["balance"])):parseInt(robot["balance"]);
            robot["tradingDeals"].push({
                mskDateTime: (new Date).toLocaleString("en-US", {timeZone: "'Europe/Moscow'"}),
                orderType: order,
                positionsCount: count,
                positionsPrice: signal_price_Close,
                balanceBeforeTransaction: balanceBefore
            })
        }
    }
    function calcTradesProfit(trades,initialBalance){
        let balance = initialBalance;
        let stocks = 0;
        for (let t of trades) {
            balance+= t.order==="buy"?(-t.positionsCount*t.positionsPrice):(t.positionsCount*t.positionsPrice)
            stocks+= t.order==="buy"?t.positionsCount:-t.positionsCount;
        }
        balance+=stocks*trades[trades.length-1].positionsPrice;
        return balance;
    }
})


module.exports = router;
