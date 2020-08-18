import type {Store} from '@reduxjs/toolkit'

let _store: Store;

export const setStore = (store: Store) => _store = store;
export const getStore = (): Store => {
  if (!_store) throw new Error('Run setStore first, before call this method');
  return _store;
}