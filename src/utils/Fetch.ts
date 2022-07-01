import { createSetting } from "../store/settings";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import qs from "querystring";
import { AttendanceRecord } from "../store/records";
import moment from "moment";
import { addPushedRecords } from "../store/pushedRecords";
import _ from "lodash";
import { setPushingPercent } from "../store/settings/pushingPercent";
import { getCheckinCodesSetByIp, setCheckinCodes } from "../store/settings/checkinCodes";
import { getDeviceById } from "../store/devices/actions";

axios.defaults.baseURL = "https://base.vn";
axios.defaults.headers["Content-Type"] = "application/x-www-form-urlencoded";
axios.defaults.headers["Access-Control-Allow-Origin"] = "*";

export interface TokenSetting {
  token: string;
  password: string;
  sysDomain: string;
}

const { get: getToken, set: setToken, use: useToken } = createSetting<
  TokenSetting
>("token", {
  token: "",
  password: "",
  sysDomain: "base.vn",
});

interface BaseResponse {
  code: 0 | 1;
  data: any;
  message: string;
}

const Fetch = {
  getToken,
  setToken,
  useToken,

  __getBaseUrl: (url: string) => {
    let { sysDomain } = getToken();
    sysDomain = sysDomain || "base.vn";

    if (url.startsWith("@")) {
      return url.replace(/^@(\w+)/g, "https://$1." + sysDomain);
    }

    if (url.startsWith("base-")) {
      return url.replace(
        /^base-(\w+):\/\//g,
        "https://$1." + sysDomain + "/$2"
      );
    }

    return url;
  },

  post: async function <T extends object>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig

    // @ts-ignore
  ): AxiosPromise<BaseResponse & T> {
    const response = await axios.post(
      this.__getBaseUrl(url),
      qs.stringify(data),
      config
    );

    if (response.data.code === 0) {
      throw new Error(response.data.message);
    }

    return response;
  },

  checkTokenIsValid: async function (token: TokenSetting) {
    try {
      await this.post("@checkin/v1/client/realtime", {
        client_token: token.token,
        client_password: token.password,
      });
      // if not response error, set Token
      return token
    } catch (e) {
      if (e.message === "INVALID_EMPLOYEE") {
        // setToken(token);
        return token;
      }
      throw e;
    }
  },

  requestCheckinCodes: async function (ip: string, token: {token: string, password: string}) {
    if (!token.token) throw new Error("INVALID TOKEN");

    const { data } = await this.post<{ checkin_codes: string[] }>(
      "@checkin/v1/client/checkin_codes",
      {
        client_token: token.token,
        client_password: token.password,
      }
    );

    setCheckinCodes(data.checkin_codes.map(Number), ip);

    return data.checkin_codes;
  },

  realtimePush: async function (record: AttendanceRecord) {
    // const token = getToken();
    console.log('realtimePush ', record);
    const device = getDeviceById(record.deviceIp);

    if (!device || !device.clientToken) throw new Error("INVALID TOKEN");

    if (!getCheckinCodesSetByIp(record.deviceIp).has(record.uid)) return;

    try {
      await this.post("@checkin/v1/client/realtime", {
        client_token: device.clientToken,
        client_password: device.clientPassword,
        user_code: record.uid,
        ts: Math.round(record.timestamp / 1000),
      });
    } catch (e) {
      // if (e.message === "INVALID_CLIENT") {
      //   setToken({ token: "", password: "", sysDomain: "base.vn" });
      // }
      throw e;
    }

    addPushedRecords([record.id]);
  },

  massPush: async function (records: AttendanceRecord[], token: {token: string, password: string, IP: string}) {
    console.log('listIps ', records)

    interface MassPushLog {
      user_code: string | number;
      dates: {
        [date: number]: {
          date: number;
          logs: {
            id: string;
            deviceUserId: number;
            time: number;
            ip: string;
          }[];
        };
      };
    }

    const willBeAddedToPushedRecordsArray: Map<
      string | number,
      Set<string>
    > = new Map();
    console.log('push log')
    const logs: Record<string, MassPushLog> = {};
    records.forEach((record) => {
      if (!logs[record.uid]) {
        willBeAddedToPushedRecordsArray.set(record.uid, new Set());

        logs[record.uid] = {
          user_code: record.uid,
          dates: {},
        };
      }

      willBeAddedToPushedRecordsArray.get(record.uid)?.add(record.id);

      const firstOfDay = Math.floor(
        moment(record.timestamp).startOf("day").valueOf() / 1000
      );

      if (!logs[record.uid].dates[firstOfDay]) {
        logs[record.uid].dates[firstOfDay] = {
          date: firstOfDay,
          logs: [],
        };
      }

      logs[record.uid].dates[firstOfDay].logs.push({
        deviceUserId: record.uid,
        id: record.id,
        ip: record.deviceIp,
        time: Math.floor(record.timestamp / 1000),
      });
    });

    try {
      console.log('push here')
      const { data } = await this.post<{
        data: {
          errors: {
            message: string;
            user_code?: number;
          }[];
        };
      }>("@checkin/v1/client/mass_sync", {
        client_token: token.token,
        client_password: token.password,
        logs: JSON.stringify(Object.values(logs)),
      });

      data.data.errors.forEach(
        (error: { message: string; user_code: string | number }) => {
          if (error.message === "INVALID EMPLOYEE") {
            willBeAddedToPushedRecordsArray.delete(error.user_code);
          }
        }
      );

      // start add to pushed records
      let pushRecordIds: string[] = [];
      willBeAddedToPushedRecordsArray.forEach((set) => {
        pushRecordIds = [...pushRecordIds, ...Array.from(set)];
      });
      addPushedRecords(pushRecordIds);
    } catch (e) {
      console.log('e ',e )
      if (e.message === "INVALID_CLIENT") {
        throw `${token.IP} invalid client token or password`
      }
      // if (e.message === "INVALID_CLIENT") {
      //   setToken({
      //     token: "",
      //     password: "",
      //     sysDomain: "base.vn",
      //   });
      // }
      throw e;
    }
  },

  massPushByIp: async function (records: AttendanceRecord[]) {
    let objectRecord: {[id: string]: any[]} = {};
    for (let i =0; i<records.length; i++) {
      const _record = records[i];
      if (objectRecord[_record.deviceIp]) {
        objectRecord[_record.deviceIp].push(_record)
      } else {
        objectRecord[_record.deviceIp] = [_record]
      }
    }
    const listIps = Object.keys(objectRecord);
    for (let i = 0; i< listIps.length; i++) {
      const deviceIp = listIps[i];
      const storeDevice = getDeviceById(deviceIp);
      if (!storeDevice) {
        continue
      }
      if (!storeDevice.clientToken || !storeDevice.clientPassword) {
        throw new Error("INVALID TOKEN")
      }
      console.log('vao day')
      await this.massPush(objectRecord[deviceIp], {token: storeDevice.clientToken, password: storeDevice.clientPassword, IP: storeDevice.domain})
    }
  },

  massPushSplitByChunks: async function (
    logs: AttendanceRecord[],
    progressCallback?: (current: number, total: number) => any
  ) {
    const chunks = _.chunk(logs, 1000);
    setPushingPercent(0);

    let index = 0;
    for (const chunk of chunks) {
      await this.massPushByIp(chunk as AttendanceRecord[]);
      progressCallback?.(index + 1, chunks.length);
      setPushingPercent(
        Math.floor(((index + 1) / chunks.length) * 10000) / 100
      );
      index++;
    }

    setPushingPercent(0);
  },
};

export default Fetch;
