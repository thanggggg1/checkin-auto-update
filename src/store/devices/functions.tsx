import Requests from "../../Services/Requests";
import { hex_md5 } from "../../utils/hex_md5";
import { getPwdChangeParams } from "../../utils/portalCheck";
import { getSettingDevice, setSettingDevice } from "../settings/currentDevice";
import { Device, syncDevices } from "./index";

const https = require("https");

// export interface LoginParams {
//   domain: string;
//   username: string;
//   password: string
// }
//
// export const requestLoginDevice = async ({ domain, username, password }: LoginParams) => {
//   // @ts-ignore
//   const { data, headers }: { data: { User: RawUserInterface }, headers: any } = await axios({
//       method: "post",
//       baseURL: domain,
//       url: "/api/login",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       data: JSON.stringify({
//         "User": {
//           "login_id": username,// "admin",
//           "password": password // "Base@53rv1c3"
//         }
//       }),
//       httpsAgent: new https.Agent({
//         rejectUnauthorized: false
//       })
//     }
//   ).catch(e => {
//     return {
//       error: true,
//       message: e?.response?.data?.Response?.message || ""
//     };
//   });
//   if (headers && headers["bs-session-id"]) {
//     return {
//       error: false,
//       sessionId: headers["bs-session-id"]
//     };
//   }
//   return {
//     error: false,
//     message: "Đăng nhập tài khoản Biostar 2 không thành công"
//   };
// };


interface EventLogParams {
  domain: string,
  startTime: string //2022-06-10 07:27:49
  endTime: string //2022-06-10 07:27:49
  token: string
}

export const requestEventLog = async ({
                                        domain,
                                        startTime, // 2022-06-10 07:27:49
                                        endTime, // 2022-06-10 10:27:49
                                        token
                                      }: EventLogParams) => {
  try {
    const data:any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/accTransaction.do`,
        "method": "post",
        "headers": {
          "Cookie": `SESSION=${token}`
        },
        "params": {
          "list": "",
          "pageSize":500,
          "startTime":`${encodeURI(startTime)}`,
          "endTime":`${encodeURI(endTime)}`,
          "sortOrder":'asc',
          "sortName":'eventTime',
          "posStart":0
        },
      })
    });

    console.log("fetch ", data);
    return data?.response ;
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return ''
  }
};



interface LoginParams {
  domain: string,
  username: string,
  password: string
}

export const requestLoginDevice = async ({
                                           domain,
                                           username,
                                           password
                                         }: LoginParams) => {
  const _device=getSettingDevice();
  try {
    // check password before login
  const res =  await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/portalPwdEffectiveCheck.do`,
        "method": "post",
        "params": {
          "content": `${getPwdChangeParams(`${username}`, `${hex_md5(password)}`, "")}`
        },

      })
    });
    console.log('res',res);
  // @ts-ignore
    const cookie =  res.header._store['set-cookie'][1].split(';')[0].split('=')[1]
    // request login
    const data:any = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/login.do`,
        "method": "post",
        "headers":{
          "Cookie":`SESSION=${cookie}`
        },
        "params": {
          "loginType":"NORMAL",
          "username": `${username}`,
          "password": `${hex_md5(password)}`
        },
      })
    });
    console.log('data',data);
    if (data?.response) {
      _device && setSettingDevice({ ..._device,token:data?.header._store['set-cookie'][1].split(';')[0].split('=')[1], status: 'Online' });
    } else {
      _device && setSettingDevice({ ..._device, status: 'Offline' });
    }
    return data;
  } catch (e) {
    _device && setSettingDevice({ ..._device, status: 'Offline' });
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};
