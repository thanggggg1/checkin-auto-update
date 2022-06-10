import axios from "axios";
import { FormatDateSearch, MaxEvenEachRequest, RawEvent, RawUserInterface } from "./types";
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
  startDate?: string // 2022-03-26T17:00:00.000Z
  endDate?: string
  access_token: string
}

export const requestEventLog = async ({
                                        domain,
                                        startDate, // 2022-06-10 07:27:49
                                        endDate, // 2022-06-10 10:27:49
                                        access_token
                                      }: EventLogParams) => {
  try {
    console.log("from ", startDate);
    const { data }: { data: { EventCollection: { rows: RawEvent[] } } } = await axios({
        method: "get",
        baseURL: domain,
        url: `/api/transaction/list?pageNo=1&pageSize=${MaxEvenEachRequest}&access_token=${access_token}`,
        params: {
          pageNo: 1,
          pageSize: MaxEvenEachRequest,
          access_token: access_token,

        }
      }
    );
    console.log("data ", data);
    return data?.EventCollection?.rows || [];
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};
