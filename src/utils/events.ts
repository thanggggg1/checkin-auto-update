const {EventEmitter} = require('events');

export const events = new EventEmitter({
  captureRejections: true
});

export enum Events {
  MASS_SYNC = 'MASS_SYNC', // dung de call function sync all data
  SYNC_DONE = 'SYNC_DONE' // khi sync xong 1 cai se call here
}