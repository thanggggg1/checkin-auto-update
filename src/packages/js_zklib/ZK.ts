import {MonitorOptions, ZKLib} from './index';
import Bluebird from 'bluebird';

export interface RawAttendance {
  state: number;
  timestamp: Date;
  id: number; // user_id
}

export interface ZKFreeSizes {
  users: number;
  logs: number;
  capacity: number;
}

export default class ZK {
  zklib: ZKLib;

  createSocket: () => Bluebird<void>;
  closeSocket: () => Bluebird<void>;

  connect: () => Bluebird<void>;
  disconnect: () => Bluebird<void>;

  freeData: () => Bluebird<void>;

  serialNumber: () => Bluebird<string>;

  version: () => Bluebird<string>;

  getTime: () => Bluebird<Date>;
  setTime: (date: Date) => Bluebird<void>;

  getAttendance: (progress?: (current: number, total: number) => void) => Bluebird<RawAttendance[]>;
  clearAttendanceLog: () => Bluebird<void[]>;

  delUser: (uid: string) => Bluebird<void>;
  setUser: () => Bluebird<void>; // @todo
  enrollUser: () => Bluebird<void>; // @todo
  getUser: () => Bluebird<any>; // @todo

  enableDevice: () => Bluebird<void>;
  disableDevice: () => Bluebird<void>;
  getFreeSizes: () => Bluebird<ZKFreeSizes>;

  constructor(options: { port: number | undefined; ip: string | undefined; inport: number; connectionType: "tcp" | "udp" | undefined; timeout: number }) {
    this.zklib = new ZKLib(options);

    this.createSocket = this._createPromisify('createSocket');
    this.closeSocket = this._createPromisify('closeSocket');

    // connect
    this.connect = this._createPromisify('connect');
    this.disconnect = this._createPromisify('disconnect');

    this.freeData = this._createPromisify('freeData');

    // serial
    this.serialNumber = this._createPromisify('serialNumber');

    // version
    this.version = this._createPromisify('version');

    // time
    this.getTime = this._createPromisify('getTime');
    this.setTime = this._createPromisify('setTime');

    // attendance
    this.getAttendance = this._createPromisify('getAttendance');
    this.clearAttendanceLog = this._createPromisify('clearAttendanceLog');

    // user
    this.delUser = this._createPromisify('delUser');
    this.setUser = this._createPromisify('setUser');
    this.enrollUser = this._createPromisify('enrollUser');
    this.getUser = this._createPromisify('getUser');

    // device
    this.enableDevice = this._createPromisify('enableDevice');
    this.disableDevice = this._createPromisify('disableDevice');
    this.getFreeSizes = this._createPromisify('getFreeSizes');
  }

  _createPromisify = <T>(method: keyof ZKLib): (() => Bluebird<T>) => {
    return Bluebird.promisify(this.zklib[method].bind(this.zklib));
  };

  startMon = (options: MonitorOptions): () => void => this.zklib.startMon(options);
}
