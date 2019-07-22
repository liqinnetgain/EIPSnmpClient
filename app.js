process.env["LOGSTASH_IP"] = "10.0.10.104";
process.env["LOGSTASH_PORT"] = 5033;

const isTest = true;
const snmp = require("snmp-native");
const logstash = require("node-logstash-send");
const dateFormat = require("dateformat");
const faker = require("faker");
let snmpValue = 0;
// let snmpValueNew = 0;
const EIPIP = "10.0.10.108";
const OID = "1.3.6.1.4.1.2440.1.11.2.4.8.0";
const duration = 1000 * 60 * 60 * 4;
const sleepTime = 1000 * 3;

function _send2Logstash(snmpvalue) {
    return new Promise((resolve, reject) => {
    });
}

function send2Logstash(snmpvalue) {
    let mockdata = getRandomArbitrary();  //MOCK data
    if(!isTest) console.log("send data: %s to logstash", snmpvalue);
    else console.log("send mock data: %s to logstash", mockdata);
    logstash({
        timestamp: dateFormat(dateFormat(new Date(), "yyyy-mm-dd h:MM:ss")),
        oid: OID,
        data: !isTest ? snmpvalue : mockdata
    })
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

function _snmpGetValue(snmpvalue) {
    return new Promise((resolve, reject) => {
        console.log("trying to get snmp value:::%s", Date.now());
        let session = new snmp.Session({
            host: "10.0.10.108",
            port: 161,
            community: "public"
        });
        session.get(
            {oid: [1, 3, 6, 1, 4, 1, 2440, 1, 11, 2, 4, 8, 0]},
            (error, letbinds) => {
                if (error) {
                    console.log("Fail :(");
                    reject("Fail : %s", error);
                } else {
                    console.log(
                        letbinds[0].oid +
                        " = " +
                        letbinds[0].value +
                        " (" +
                        letbinds[0].type +
                        ")"
                    );
                    console.log(Date.now());
                    snmpValue = letbinds[0].value;
                    session.close();
                    resolve(letbinds[0].value);
                }
            }
        );
    });
}

function snmpGetValue() {
    let session = new snmp.Session({
        host: "10.0.10.108",
        port: 161,
        community: "public"
    });
    session.get({oid: [1, 3, 6, 1, 4, 1, 2440, 1, 11, 2, 4, 8, 0]}, function (
        error,
        letbinds
    ) {
        if (error) {
            console.log("Fail :(");
        } else {
            console.log(
                letbinds[0].oid +
                " = " +
                letbinds[0].value +
                " (" +
                letbinds[0].type +
                ")"
            );
            snmpValue = letbinds[0].value;
            session.close();
        }
    })
}

async function main() {
    let endTime = Date.now() + duration;
    let prevSnmpValue;
    let n = 1;
    console.log("Start time: %s", Date.now())
    while (true) {
        if (Date.now() > endTime) {
            console.log("snmp fetching completed");
            process.exit(0);
        }
        console.log("The %sth time get the value", n);
        prevSnmpValue = snmpValue;
        await snmpGetValue();
        await sleep(sleepTime);
        console.log("new snmpValue=%s", snmpValue);
        console.log("prev snmpValue=%s", prevSnmpValue);
        send2Logstash(snmpValue - prevSnmpValue);
        await sleep(sleepTime);
        n++;
    }
}

async function main_promise() {
    let endTime = Date.now() + 30000;
    let _snmpValue;
    let n = 1;
    console.log("Start time: %s", Date.now())
    console.log("End time: %s", endTime)
    while (true) {
        if (Date.now() > endTime) {
            console.log("snmp fetching completed");
            process.exit(0);
        }
        _snmpGetValue().then(async sData => {
            console.log("The %sth time get the value", n);
            _snmpValue = snmpValue;
            console.log("data returned:%s", sData);
            console.log("new snmpValue=%s", snmpValue);
            console.log("prev snmpValue=%s", _snmpValue);
            send2Logstash(snmpValue);
            await sleep(5000);
        })
            .catch(e => {
                console.lo(e)
            })
    }
}

function getRandomArbitrary(min, max) {
    return  Math.floor(100000 + Math.random() * 900000);
}

// main_promise();
main();
