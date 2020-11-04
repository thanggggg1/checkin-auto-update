export interface PyattRecord {
  uid: string;
  user_id: string;
  time: string;
  state: string;
  p: string;
}

class Pyatt {
  _pyattExecutablePath = require("path").join(
    require("electron").remote.app.getAppPath(),
    "dist",
    "assets",
    "pyatt.exe"
  );

  _address: string;
  _port: number = 4370;
  _password: string = "";

  _isLiveCapturing = false;

  isUdp = false;
  isDebug = false;

  constructor(address: string, port?: number, password?: string) {
    this._address = address;
    if (port) this._port = port;
    if (password) this._password = password;
  }

  generateScriptParams = () => {
    return [
      `-a`,
      this._address,
      `-p`,
      this._port,
      this._password ? "-P" : undefined,
      this._password ? this._password : undefined,
      this.isUdp ? "--force-udp" : undefined,
      this.isDebug ? "--verbose" : undefined,
    ].filter(Boolean);
  };

  runScript = (args: string[]) => {
    return new Promise<string>((resolve, reject) => {
      const { execFile } = require("child_process");

      return execFile(
        this._pyattExecutablePath,
        [...this.generateScriptParams(), ...args],
        {
          shell: true,
        },
        (error?: Error, stdout?: string | Buffer, stderr?: string | Buffer) => {
          if (error) {
            return reject(error);
          }

          if (stderr) {
            return reject(new Error("StdErr " + String(stderr)));
          }

          return stdout ? resolve(stdout.toString()) : reject("StdOut empty");
        }
      );
    });
  };

  parseInfo = (info: string) => {
    const parseSizesCapacity = (info: string) => {
      const regex = /ZK \w+:\/\/[\w.:]+ users\[\d+]:(\d+)\/(\d+) fingers:(\d+)\/(\d+), records:(\d+)\/(\d+) faces:(\d+)\/(\d+)/;
      const matches = info.match(regex);

      return {
        usersSize: matches?.[1],
        usersCapacity: matches?.[2],
        fingersSize: matches?.[3],
        fingersCapacity: matches?.[4],
        recordsSize: matches?.[5],
        recordsCapacity: matches?.[6],
        facesSize: matches?.[7],
        facesCapacity: matches?.[8],
      };
    };

    const parseUsers = (info: string) => {
      const regex = /-> UID #.*Name {5}: (.*)Privilege : (.*)\n\s*Group ID : (.*)User ID : (.*)Password {2}: (.*)Card : (.*)/gm;
      const matches = info.matchAll(regex);
      return {
        users: [...matches].map((match) => {
          return {
            name: String(match[1]).trim(),
            privilege: String(match[2]).trim(),
            groupId: String(match[3]).trim(),
            userId: String(match[4]).trim(),
            password: String(match[5]).trim(),
            card: String(match[6]).trim(),
          };
        }),
      };
    };

    const parseRecords = (info: string) => {
      const regex = /ATT\s*\d+: uid:\s*(\d+), user_id:\s*(\d+) t: (.*), s:(\d+) p:(\d+)/gm;
      const matches = info.matchAll(regex);
      return {
        records: [...matches].map((match) => {
          return {
            uid: String(match[1]).trim(),
            user_id: String(match[2]).trim(),
            time: String(match[3]).trim(),
            state: String(match[4]).trim(),
            p: String(match[5]).trim(),
          };
        }),
      };
    };

    const extractAnyContent = (info: string, key: string) => {
      const regex = new RegExp(key + "\\s*:\\s*(.*)");
      return info.match(regex)?.[1];
    };

    const parseBasicInfo = (info: string) => {
      return [
        "SDK build=1",
        "ExtendFmt",
        "UsrExtFmt",
        "Face FunOn",
        "Face Version",
        "Finger Version",
        "Old Firm compat",
        "Time",
        "Firmware Version",
        "Platform",
        "DeviceName",
        "Serial Number",
        "MAC",
      ].reduce<Record<string, string | undefined>>((prev, curr) => {
        prev[curr] = extractAnyContent(info, curr);
        return prev;
      }, {});
    };

    return {
      ...parseBasicInfo(info),
      ...parseSizesCapacity(info),
      ...parseUsers(info),
      ...parseRecords(info),
    };
  };

  getBasicInfo = async () => this.parseInfo(await this.runScript([`-b`]));

  getTemplates = async () =>
    this.parseInfo(await this.runScript([`--templates`]));

  updateTime = async () =>
    this.parseInfo(await this.runScript(["--updatetime"]));

  openDoor = async () => this.parseInfo(await this.runScript(["--open-door"]));

  liveCapture = (
    onError?: (error: Error) => any,
    onCapture?: (data: PyattRecord) => any,
    onExitOrClose?: (data: any) => any
  ): (() => void) => {
    this._isLiveCapturing = true;

    const { spawn } = require("child_process");

    const f = spawn(this._pyattExecutablePath, [
      ...this.generateScriptParams(),
      "--live-capture",
    ]);

    f.stdout?.on("data", (data: Buffer) => {
      const recordString = data.toString();
      const regex = /ATT\s*\d+: uid:\s*(\d+), user_id:\s*(\d+) t: (.*), s:(\d+) p:(\d+)/;
      const match = recordString.match(regex);

      if (!match) return;

      onCapture?.({
        uid: String(match[1]).trim(),
        user_id: String(match[2]).trim(),
        time: String(match[3]).trim(),
        state: String(match[4]).trim(),
        p: String(match[5]).trim(),
      });
    });
    f.stderr?.on("data", (data: Buffer) => {
      console.log("stderr", data.toString());
      onError?.(new Error(data.toString()));
    });
    f.on("exit", (data: number) => {
      console.log("exit", data);
      onExitOrClose?.(data);
    });

    return () => {
      f.kill();
    };
  };

  getRecords = async () => this.parseInfo(await this.runScript(["--records"]));
}

export default Pyatt;
