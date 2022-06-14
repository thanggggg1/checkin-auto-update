import Requests from "../../Services/Requests";
import { hex_md5 } from "../../utils/hex_md5";
import { getPwdChangeParams } from "../../utils/portalCheck";

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
    const data = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": "http://10.20.1.201:8098/api/transaction/list",
        "method": "get",
        "params": {
          "pageSize": "20",
          "pageNo": "1",
          "access_token": "6AABB62DB8878A4D7373F57A237F6C94ABAA7B5261729D956E9593DF1F48D504"
        }
      })
    });

    console.log("fetch ", data);
    return data?.EventCollection?.rows || [];
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};

// export const requestPortalPwdCheck = async ()=>{
//   try {
//     const data=await new Requests().fetch({
//       paramStr:JSON.stringify({
//
//       })
//     })
//   }
//
// }

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
  try {
    // check password before login
     await new Requests().fetch({
      paramStr:JSON.stringify({
        "url":`${domain}/portalPwdEffectiveCheck.do`,
        "method":"post",
        "params":{
          "content":`${getPwdChangeParams(`${username}`,`${hex_md5(password)}`,'')}`
        }
      })
    })
    //request login
    const data = await new Requests().fetch({
      paramStr: JSON.stringify({
        "url": `${domain}/login.do`,
        "method": "post",
        "params": {
          "username": `${username}`,
          "password": `${hex_md5(password)}`
        }
      })
    });
    return data;
  } catch (e) {
    console.log("e ", e.response);
    if (e?.response?.status === 401) {
      return 401;
    }
    return [];
  }
};

interface TransactionsParams {
  domain: string,
  startTime?: string,
  endTime?: string
}
//
// export const requestTransactions = async ({
//                                             domain,
//                                             startTime,
//                                             endTime
//                                           }: TransactionsParams) => {
//   try {
//     const data = await new Requests().fetch({
//       paramStr: JSON.stringify({
//         "url": `${domain}/login.do`,
//         "method": "post",
//         "params": {
//           "list": `${username}`,
//           "password": `${hex_md5(password)}`
//         }
//       })
//     });
//
//     console.log("fetch ", data);
//     return data?.EventCollection?.rows || [];
//   } catch (e) {
//     console.log("e ", e.response);
//     if (e?.response?.status === 401) {
//       return 401;
//     }
//     return [];
//   }
// };
