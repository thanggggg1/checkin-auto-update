import {Store} from '@reduxjs/toolkit';

let _store: Store | undefined = undefined;
export const setStore = (store: Store) => _store = store;
export const getStore = () => {
  if (!_store) throw new Error('Please implement setStore before run this function');
  return _store;
}