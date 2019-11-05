const http = require("http");
const url = require("url");
const fs = require("fs");
const childProcess = require("child_process");

http.createServer((req, res) => {
    if (req.method === "POST") {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => process(data))
    } else if (req.method === "GET") {
        process(url.parse(req.url).query["data"]);
    }
    function process(data) {
        processData(data).then(readStream => {
            res.writeHead(200, {"Content-Type": "application/octet-stream"});
            readStream.on("readable", () => {
                res.write(readStream.read());
                readStream.on("end", () => res.end());
            });
        }).catch(e => {
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
                let resultFilename = "./_"+ +Date.now() + ".txt";
                let tlogProcess = childProcess.spawn("mono", ["./TLogParserV5.exe", tlogFilename]);
                let output = null;
                tlogProcess.stderr.on("data", data => (output === null) ? output = data : output += data);
                tlogProcess.stdout.on("data", data => (output === null) ? output = data : output += data);
                tlogProcess.on("close", (code) => {
                    if (code !== 0) {
                        reject(new Error(output + ""));
                    } else {
                        fs.unlink(tlogFilename, err1 => {
                            if (err1) {
                                reject(err1);
                            } else {
                                let readStream = fs.createReadStream(resultFilename);
                                readStream.on("close", () => fs.unlink(resultFilename, e => {
                                    if (e) console.log(e);
                                }));
                                resolve(readStream);
                            }
                        });
                    }
                });
            }
        });
    });
}