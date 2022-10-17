import { useEffect } from "react";
import log from 'electron-log';
import { getAllDevicesObj } from "../store/devices";
const ping = require("ping");

export const HeartBeat = () => {

  useEffect(() => {
    const _l = setInterval(() => {
      const devices = Object.values(getAllDevicesObj());
      devices.map(device => {
        ping.promise.probe(device.ip, {
          timeout: 2
        }).then(({alive}: {alive: boolean}) => {
          log.info(`[PING] ${device.ip}: ${alive ? 'alive': 'die'}`)
        })
      })
    }, 5 * 60 * 1000);

    return () => {
      _l && clearInterval(_l)
    }
  }, [])


  return null
}
