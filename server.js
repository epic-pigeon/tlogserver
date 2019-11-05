const http = require("http");
//const url = require("url");
const fs = require("fs");
const childProcess = require("child_process");

http.createServer((req, res) => {
    if (req.method === "POST") {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => {
            //console.log(data);
            process(data);
        })
    } else res.end("");
    function process(data) {
        processData(data).then(str => {
            console.log("k");
            res.writeHead(200, {"Content-Type": "application/octet-stream"});
            res.end(str);
        }).catch(e => {
            console.log("err");
            console.log(e);
            res.writeHead(520, {"Content-Type": "text/plain"});
            res.end(e + "");
        });
    }
}).listen(8080);

function processData(data) {
    return new Promise((resolve, reject) => {
        let tlogFilename = "./_"+ +Date.now() + ".tlog";
        fs.writeFile(tlogFilename, data, err => {
            if (err) {
                reject(err);
            } else {
                let tlogProcess = childProcess.spawn("mono", ["/var/www/html/nodejs/tlogserver/TLogParserV5.exe", tlogFilename]);
                let output = "";
                tlogProcess.stdout.on("data", data => output += data);
                tlogProcess.on("close", (code) => {
                    if (code !== 0) {
                        reject(new Error(code));
                    } else {
                        console.log("kar");
                        fs.unlink(tlogFilename, err1 => {
                            if (err1) {
                                reject(err1);
                            } else {
                                resolve(output);
                            }
                        });
                    }
                });
            }
        });
    });
}