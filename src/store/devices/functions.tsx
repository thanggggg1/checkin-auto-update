import Requests from "../../Services/Requests";
import { hex_md5 } from "../../utils/hex_md5";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { getSettingZkBioSystem, setSettingZkBioSystem } from "../settings/settingZkBioSystem";
import axios from "axios";
import { FormatDateSearch, MaxEvenEachRequest, RawEvent, RawUserInterface } from "./types";
import dayjs from "dayjs";


const https = require("https");


//BioStar2
export interface LoginParamsBioStar {
  domain: string;
  username: string;
  password: string
}

export const requestLoginDeviceBioStar = async ({ domain, username, password }: LoginParamsBioStar) => {
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


interface EventLogParamsBioStar {
  domain: string,
  sessionId: string |undefined,
  hint?: string
  from: string // 2022-03-26T17:00:00.000Z
}

export const requestEventLogBioStar = async ({
                                               domain,
                                               from,
                                               hint,
                                               sessionId
                                             }: EventLogParamsBioStar) => {
  try {
    console.log("from ", from);
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
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};


//ZkBioSecurity
interface EventLogParamsZkBio {
  domain: string,
  startTime: string //2022-06-10 07:27:49
  endTime: string //2022-06-10 07:27:49
  token: string
}

export const requestEventLogZkBio = async ({
                                             domain,
                                             startTime, // 2022-06-10 07:27:49
                                             endTime, // 2022-06-10 10:27:49
                                             token
                                           }: EventLogParamsZkBio) => {
  try {
    const data: any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/accTransaction.do`,
        "method": "post",
        "headers": {
          "Cookie": `SESSION=${token}`
        },
        "params": {
          "list": "",
          "pageSize": 800,
          "startTime": `${encodeURI(startTime)}`,
          "endTime": `${encodeURI(endTime)}`,
          "sortOrder": "asc",
          "sortName": "eventTime",
          "posStart": 0
        }
      })
    });

    console.log("fetch ", data);
    return data?.response;
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return "";
  }
};


interface LoginParamsZkBio {
  domain: string,
  username: string,
  password: string
}

export const requestLoginDeviceZkBio = async ({
                                                domain,
                                                username,
                                                password
                                              }: LoginParamsZkBio) => {
  const _ZkBioSystem = getSettingZkBioSystem();
  try {
    // check password before login
    const res = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/portalPwdEffectiveCheck.do`,
        "method": "post",
        "params": {
          "content": `${getPwdChangeParams(`${username}`, `${hex_md5(password)}`, "")}`
        }
      })
    });
    // @ts-ignore
    const cookie = res.header._store["set-cookie"][1].split(";")[0].split("=")[1];
    // request login
    const data: any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/login.do`,
        "method": "post",
        "headers": {
          "Cookie": `SESSION=${cookie}`
        },
        "params": {
          "loginType": "NORMAL",
          "username": `${username}`,
          "password": `${hex_md5(password)}`
        }
      })
    });

    if (data?.response) {
      _ZkBioSystem && setSettingZkBioSystem({
        ..._ZkBioSystem,
        token: data?.header._store["set-cookie"][1].split(";")[0].split("=")[1],
        status: "Online"
      });
    } else {
      _ZkBioSystem && setSettingZkBioSystem({ ..._ZkBioSystem, status: "Offline" });
    }
    return data;
  } catch (e) {
    _ZkBioSystem && setSettingZkBioSystem({ ..._ZkBioSystem, status: "Offline" });
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};
