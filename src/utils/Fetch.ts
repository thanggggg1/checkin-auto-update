import { createSetting } from "../store/settings";
import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import qs from "querystring";
import { AttendanceRecord } from "../store/records";
import moment from "moment";
import { addPushedRecords } from "../store/pushedRecords";

axios.defaults.baseURL = "https://base.vn";
axios.defaults.headers["Content-Type"] = "application/x-www-form-urlencoded";
axios.defaults.headers["Access-Control-Allow-Origin"] = "*";

export interface TokenSetting {
  token: string;
  password: string;
}

const { get: getToken, set: setToken, use: useToken } = createSetting<
  TokenSetting
>("token", {
  token: "5-DO6dvW-kdg2YSKQ8bfQU9FWstJ4v1MxYOIpJajcvU",
  password: "123456",
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
    if (url.startsWith("@")) {
      return url.replace(/^@(\w+)/g, "https://$1.base.vn");
    }

    if (url.startsWith("base-")) {
      return url.replace(/^base-(\w+):\/\//g, "https://$1.base.vn/$2");
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
      setToken(token);
    } catch (e) {
      if (e.message === "INVALID_EMPLOYEE") {
        setToken(token);
        return;
      }
      throw e;
    }
  },

  realtimePush: async function (record: AttendanceRecord) {
    const token = getToken();

    if (!token.token) throw new Error("INVALID TOKEN");

    await this.post("@checkin/v1/client/realtime", {
      client_token: token.token,
      client_password: token.password,
      user_code: record.uid,
      ts: Math.round(record.timestamp / 1000),
    });

    addPushedRecords([record.id]);
  },

  massPush: async function (records: AttendanceRecord[]) {
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
        time: record.timestamp,
      });
    });

    const token = getToken();
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
  },
};

export default Fetch;
