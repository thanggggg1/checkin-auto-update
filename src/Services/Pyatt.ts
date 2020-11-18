import { AttendanceRecord } from "../store/records";

export interface PyattRecord {
  index: number;
  uid: string;
  user_id: string;
  time: string;
  state: string;
  p: string;
}

const { app } = require("electron").remote;
const path = require("path");

class Pyatt {
  _pyattFileName = "pyatt.exe";
  _pyattExecutablePath = path.join(
    app.getAppPath(),
    ...[app.isPackaged ? ".." : "", "dist", "assets"].filter(Boolean)
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
      '-T',
      60000,
      this._password ? "-P" : undefined,
      this._password ? this._password : undefined,
      this.isUdp ? "--force-udp" : undefined,
      this.isDebug ? "--verbose" : undefined,
    ].filter(Boolean);
  };

  runScript = (args: string[], onData?: (data: Buffer) => any) => {
    return new Promise<string>((resolve, reject) => {
      const { execFile } = require("child_process");

      const exec = execFile(
        this._pyattFileName,
        [...this.generateScriptParams(), ...args],
        {
          cwd: this._pyattExecutablePath,
          maxBuffer: 1024 * 1024 * 50, // Max 50MB per buffer
          windowsVerbatimArguments: true,
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

      if (onData) exec.stdout.on("data", onData);
    });
  };

  parseSizesCapacity = (info: string) => {
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

  parseSingleRecord = (info: string): PyattRecord | undefined => {
    const regex = /ATT\s*(\d+): uid:\s*(\d+), user_id:\s*(\d+) t: (.*), s:(\d+) p:(\d+)/;
    const match = info.match(regex);

    if (!match) return;

    return {
      index: Number(match[1]),
      uid: String(match[2]).trim(),
      user_id: String(match[3]).trim(),
      time: String(match[4]).trim(),
      state: String(match[5]).trim(),
      p: String(match[6]).trim(),
    };
  };

  parseRecords = (info: string): { records: PyattRecord[] } => {
    const regex = /ATT\s*(\d+): uid:\s*(\d+), user_id:\s*(\d+) t: (.*), s:(\d+) p:(\d+)/gm;
    const matches = info.matchAll(regex);
    return {
      records: [...matches].map((match) => {
        return {
          index: Number(match[1]),
          uid: String(match[2]).trim(),
          user_id: String(match[3]).trim(),
          time: String(match[4]).trim(),
          state: String(match[5]).trim(),
          p: String(match[6]).trim(),
        };
      }),
    };
  };

  parseInfo = (info: string) => {
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
      ...this.parseSizesCapacity(info),
      ...parseUsers(info),
      ...this.parseRecords(info),
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
    onExitOrClose?: (data: any) => any,
    onAnyData?: (data: string) => any
  ): (() => void) => {
    this._isLiveCapturing = true;

    const { spawn } = require("child_process");

    const f = spawn(
      this._pyattFileName,
      [...this.generateScriptParams(), "--live-capture"],
      { cwd: this._pyattExecutablePath, windowsVerbatimArguments: true }
    );

    f.stdout?.on("data", (data: Buffer) => {
      const recordString = data.toString();
      onAnyData?.(recordString);

      const record = this.parseSingleRecord(recordString);
      if (record && onCapture) {
        onCapture(record);
      }
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
      setTimeout(() => f.kill("SIGINT"), 2000);
    };
  };

  getRecords = async (
    params: {
      onStarted?: () => any;
      onRecords?: (records: PyattRecord[]) => any;
      onPercent?: (total: number, current: number) => any;
    } = {}
  ) => {
    let isRunStarted = false;
    let hasSize = false;
    let total = 0; // Total records

    return this.parseInfo(
      await this.runScript(["--records"], (data) => {
        if (!isRunStarted) {
          params.onStarted?.();
          isRunStarted = true;
        }

        const str = data.toString();

        if (!hasSize) {
          const { recordsSize } = this.parseSizesCapacity(str);
          if (recordsSize) {
            hasSize = true;
            total = Number(recordsSize);
            params.onPercent?.(total, 0);
            return;
          }
        }

        const { records } = this.parseRecords(str);

        if (records.length) {
          params.onRecords?.(records);
          const latestRecord = records[records.length - 1];
          if (latestRecord && params.onPercent)
            params.onPercent(total, latestRecord.index);
        }
      })
    );
  };

  static pyattRecordToAttendance = (
    record: PyattRecord,
    deviceIp: string
  ): AttendanceRecord => {
    const time = require("moment")(record.time, "YYYY-MM-DD HH:mm:ss");
    return {
      id: `${record.user_id}_${time.valueOf()}`,
      dateFormatted: time.format("DD/MM/YYYY"),
      timeFormatted: time.format("HH:mm:ss"),
      timestamp: time.valueOf(),
      uid: Number(record.user_id),
      deviceIp,
    };
  };
}

export default Pyatt;
