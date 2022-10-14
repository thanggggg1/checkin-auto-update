import { useEffect } from "react";
import log from 'electron-log';
import { getAllDevicesObj } from "../store/devices";
const ping = require("ping");

function logBytes(x: any) {
  console.log(x[0], x[1] / (1000.0*1000), "MB")
}

export const HeartBeat = () => {

  useEffect(() => {
    const _l = setInterval(() => {
      log.info("[MEMORY USAGE]");

      // get memory usage
      Object.entries(process.memoryUsage()).map(logBytes)

      const devices = Object.values(getAllDevicesObj());
      devices.map(device => {
        ping.promise.probe(device.ip, {
          timeout: 2
        }).then(({alive}: {alive: boolean}) => {
          log.info(`[PING] ${device.ip}: ${alive ? 'alive': 'die'}`)
        })
      })
    }, 3 * 60 * 1000);

    return () => {
      _l && clearInterval(_l)
    }
  }, [])


  return null
}
