const { app } = require("electron").remote;
const path = require("path");

const currentYear = new Date().getFullYear();

class Requests {
  pythonFilename = "python_request.exe";
  _pyattExecutablePath = path.join(
    app.getAppPath(),
    ...[app.isPackaged ? ".." : "", "dist", "assets"].filter(Boolean)
  );


  runScript = (args: string, onData?: (data: Buffer) => any) => {
    return new Promise<string>((resolve, reject) => {
      const { execFile } = require("child_process");
      const exec = execFile(
        this.pythonFilename,
        [...args],
        {
          cwd: this._pyattExecutablePath,
          maxBuffer: 1024 * 1024 * 50, // Max 50MB per buffer
          windowsVerbatimArguments: true
        },
        (error?: Error, stdout?: string | Buffer, stderr?: string | Buffer) => {
          // console.log("vao daytyttttt ", error, stdout, stderr);
          if (error) {
            return reject(error);
          }

          if (stderr) {
            return reject(new Error("StdErr " + String(stderr)));
          }

          return stdout ? resolve(stdout.toString()) : reject("StdOut empty");
        }
      );

      if (onData) exec.stdout.on("data", onData);
    });
  };

  fetch = async (
    params: {
      paramStr: string;     //'{\"url\":\"http://10.20.1.201:8098/api/transaction/list?pageNo=1&pageSize=20&access_token=6AABB62DB8878A4D7373F57A237F6C94ABAA7B5261729D956E9593DF1F48D504\", \"method\":\"get\"}'
      onStarted?: () => any;
      onRecords?: (records: any) => any;
    }
  ) => {
    return await new Promise((resolve, reject) => {
      console.log('params ', params.paramStr.replace(/"/g, "\\\""));
      let result = "";
      this.runScript(["--queries " + params.paramStr.replace(/"/g, "\\\"")], (data) => {
        const str = data;
        if(str.trim()) {
          if(!result){
            result = str;
            resolve(JSON.parse(str));
          }
        }
      });
      setTimeout(() => {
        if (result){
          return
        }
        resolve({
          headers: "",
          response:""
        })
      }, 10000)
    });
  };
}

export default Requests;
