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
        processData(data).then(readStream => {
            res.writeHead(200, {"Content-Type": "application/octet-stream"});
            readStream.on("readable", () => readStream.pipe(res));
            readStream.on("close", () => res.end())
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
                let tlogProcess = childProcess.spawn("mono", ["/var/www/html/nodejs/tlogserver/TLogReaderV5.exe", tlogFilename, resultFilename]);
                let stderr = "";
                tlogProcess.stderr.on("data", data => stderr += data);
                tlogProcess.on("close", (code) => {
                    if (code !== 0) {
                        console.log(code + ": " + stderr);
                        reject(new Error(code + ": " + stderr));
                    } else {
                        let readStream = fs.createReadStream(resultFilename);
                        //readStream.on("close", () => fs.unlink(resultFilename, () => {}));
                        /*fs.unlink(tlogFilename, err1 => {
                            if (err1) {
                                console.log(err1);
                                reject(err1);
                            } else {*/
                                resolve(readStream);
                            /*}
                        });*/
                    }
                });
            }
        });
    });
}