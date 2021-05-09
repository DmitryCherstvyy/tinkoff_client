const express = require('express');
const router = express.Router();

const fs = require('fs');
const { promisify } = require('util')



var createProperty = function(getSet) {
    var _value;
    var autoImplement = {
        get: function() { return _value; },
        set: function(value) { _value = value; return _value; }
    };

    getSet = getSet || autoImplement;

    var get = getSet.get || function() { throw new Error('No get method defined for this property.'); },
        set = getSet.set || function() { throw new Error('No set method defined for this property.'); };

    return function(value) {
        if (value !== undefined)
            return set(value);

        return get();
    };
};


let tr_robots_jsn_db_pr = createProperty({
    get: async ()=>
    {
        const readFileAsync = promisify(fs.readFile)
        return await JSON.parse(await readFileAsync('./tr_robots.json'));
    },
    set:(value)=>{
        fs.writeFile('./tr_robots.json',JSON.stringify(value),(err) => {if (err) throw err;console.log('Data written to file');});
    }
});



router.route('/')
.get(async (req, res) =>
{
    let m_Modified =await tr_robots_jsn_db_pr();
        for (let mModifiedKey of m_Modified) {
            const keys = Object.keys(mModifiedKey);
            delete mModifiedKey[keys[keys.length - 1]];
        }
        res.send(m_Modified)
})

.put(async (req, res) =>
{
    const body =req.body["robots"].json();

    let data = await tr_robots_jsn_db_pr();
    body.forEach((k,i)=>k["tradingDeals"]=data[i]["tradingDeals"]);
    tr_robots_jsn_db_pr(body);
    res.status(200);
})

router.get('/:tiker/tradingDeals',async (req, res) =>
{
    const tiker = req.params["tiker"];
    let data = await tr_robots_jsn_db_pr();
    res.send(data.find(t=>t["tiker"]===tiker)["tradingDeals"])
})
module.exports ={ router,tr_robots_jsn_db_pr};
