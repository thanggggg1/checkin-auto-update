import { createSetting } from "../store/settings";
import axios, { AxiosRequestConfig } from "axios";
import qs from "querystring";
import { AttendanceRecord } from "../store/records";
import moment from "moment";

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

interface DefaultResponse {
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

  post: async function <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) {
    const response = await axios.post<DefaultResponse & T>(
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

    const logs: Record<string, MassPushLog> = {};
    records.forEach((record) => {
      if (!logs[record.uid]) {
        logs[record.uid] = {
          user_code: record.uid,
          dates: {},
        };
      }

      const firstOfDay = moment(record.timestamp).startOf("day").valueOf();

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
    console.log("token", Object.values(logs));
    const { data } = await this.post("@checkin/v1/client/mass_sync", {
      client_token: token.token,
      client_password: token.password,
      logs: JSON.stringify(Object.values(logs)),
    });

    console.log("data", data);
  },
};

export default Fetch;
