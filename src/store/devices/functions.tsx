import Requests from "../../Services/Requests";
import { hex_md5 } from "../../utils/hex_md5";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { setSettingZkBioSystem } from "../../components/AccessZkBioSecurityDevice/settingZkBioSystem";
import axios from "axios";
import { FormatDateSearch, MaxEvenEachRequest, RawEvent, RawUserInterface } from "./types";
import dayjs from "dayjs";
import { Device } from "../../store/devices";


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
  sessionId: string | undefined,
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
  password: string,
  device: Device
}

export const requestLoginDeviceZkBio = async ({
                                                domain,
                                                username,
                                                password,
                                                device
                                              }: LoginParamsZkBio) => {
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
      device && setSettingZkBioSystem({
        ...device, token: data?.header._store["set-cookie"][1].split(";")[0].split("=")[1],
        status: "Online"
      });
    } else {
      device && setSettingZkBioSystem({ ...device, status: "Offline" });
    }
    return data;
  } catch (e) {
    device && setSettingZkBioSystem({ ...device, status: "Offline" });
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};


//HIK Vision
interface EventLogHikVision {
  ip: string,
  port?: number
  startTime: string //2022-09-15T00:00:00+07:00
  endTime: string //2022-09-15T00:00:00+07:00
  username: string
  password: string
}

export const requestEventHikVision = async ({
                                              ip,
                                              port,
                                              startTime,
                                              endTime, username, password,

                                            }: EventLogHikVision) => {
  try {
    const data: any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `http://${ip}:${port}/ISAPI/AccessControl/AcsEvent?format=json`,
        "method": "post",
        "params": {
          "AcsEventCond": {
            "searchID": "4b3c58a7-b80d-4647-9586-9efc3d597",
            "searchResultPosition": 0,
            "maxResults": 500,
            "major": 0,
            "minor": 0,
            "startTime": `${encodeURI(startTime)}`,
            "endTime": `${encodeURI(endTime)}`
          }
        },
        "auth": {
          "username": username,
          "password": password
        }
      })
    });

    return data?.response;
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return "";
  }
};

export const getTimeZoneHik = async ({
                                                      ip,
                                                      port,
                                                      username, password
                                                    }: {ip:string,port?:number,username:string,password:string}) => {
  try {
    const data: any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `http://${ip}:${port}/ISAPI/System/time`,
        "method": "get",
        "auth": {
          "username": username,
          "password": password
        }
      })
    });
    return data?.response;
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return "";
  }
};

