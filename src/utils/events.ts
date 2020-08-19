const {EventEmitter} = require('events');

export const events = new EventEmitter({
  captureRejections: true
});

export enum Events {
  MASS_SYNC = 'MASS_SYNC'
}