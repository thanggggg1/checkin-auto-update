import axios from "axios";
import { RawUserInterface, FormatDateSearch, RawEvent, MaxEvenEachRequest } from "./types";
import dayjs from "dayjs";

const https = require("https");

export interface LoginParams {
  domain: string;
  username: string;
  password: string
}

export const requestLoginDevice = async ({ domain, username, password }: LoginParams) => {
  // @ts-ignore
  const { data, headers }: { data: { User: RawUserInterface }, headers: any } = await axios({
      method: "post",
      baseURL: domain,
      url: "/api/login",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        "User": {
          "login_id": username,// "admin",
          "password": password // "Base@53rv1c3"
        }
      }),
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    }
  ).catch(e => {
    return {
      error: true,
      message: e?.response?.data?.Response?.message || ""
    };
  });
  if (headers && headers["bs-session-id"]) {
    return {
      error: false,
      sessionId: headers["bs-session-id"]
    };
  }
  return {
    error: false,
    message: "Đăng nhập tài khoản Biostar 2 không thành công"
  };
};


interface EventLogParams {
  domain: string,
  sessionId: string,
  hint?: string
  from: string // 2022-03-26T17:00:00.000Z
}

export const requestEventLog = async ({
                                        domain,
                                        from,
                                        hint,
                                        sessionId
                                      }: EventLogParams) => {
  try {
    const now = dayjs().format(FormatDateSearch.end);
    const { data }: { data: { EventCollection: { rows: RawEvent[] } } } = await axios({
        method: "post",
        baseURL: domain,
        url: "/api/events/search",
        headers: {
          "bs-session-id": sessionId,
          "Content-Type": "application/json"
        },
        data: {
          "Query": {
            "limit": MaxEvenEachRequest,
            "conditions": [{
              "column": "datetime",
              "operator": 3,
              "values": [from, dayjs(from).add(7, "days").format(FormatDateSearch.normal)]
            }],
            "orders": [
              {
                "column": "datetime",
                "descending": false
              }
            ]
          }
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    );
    console.log("data ", data);
    return data?.EventCollection?.rows || [];
  } catch (e) {
    console.log('e ', e.response)
    if (e?.response?.status === 401) {
      return 401
    }
    return []
  }
};