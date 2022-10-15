import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSelector } from "react-redux";

export type DynamicState<T> = {
  byKey: Record<string, T>;
  query: Record<string, string[]>;
};

export const createDynamicReducer = <T extends { [x: string]: any }>(
  name: string,
  mainKey: string,
  initialState: DynamicState<T> = { byKey: {}, query: {} }
) => {
  const { actions, reducer } = createSlice({
    name,
    initialState: initialState,
    reducers: {
      multiSet(state, action: PayloadAction<T[]>): DynamicState<T> {
        return {
          ...state,
          byKey: {
            ...state.byKey,
            ..._.fromPairs(action.payload.map((item) => [item[mainKey], item])),
          },
        };
      },
      setQueries(
        state,
        action: PayloadAction<Record<string, string[]>>
      ): DynamicState<T> {
        return {
          ...state,
          query: {
            ...state.query,
            ...action.payload,
          },
        } as DynamicState<T>;
      },
      reset(): DynamicState<T> {
        return {
          ...initialState,
        } as DynamicState<T>;
      },
      multiDelete(state, action: PayloadAction<string[]>) {
        for (const key of action.payload) {
          delete state.byKey[key];
        }
      }
    },
  });

  const useByKey = (key?: string): T | undefined => {
    // @ts-ignore
    return useSelector((state) => state[name].byKey[key]);
  };

  const emptyArray: string[] = [];
  const useKeysByQuery = (query: string = "default"): string[] => {
    // @ts-ignore
    return useSelector((state) => state[name].query[query]) || emptyArray;
  };

  let _store: Store | undefined;
  const setStore = (store: Store) => {
    _store = store;
  };

  const _getStore = (): Store => {
    if (!_store) {
      throw new Error(
        "You need to run setStore right after init store to use this function"
      );
    }

    return _store;
  };

  const getByKey = (key: string): T | undefined => {
    return _getStore().getState()[name].byKey[key];
  };

  const getKeysByQuery = (query: string): string[] => {
    return _getStore().getState()[name].query[query] || emptyArray;
  };

  const getKeyByObjs = (): Record<string, T> => {
    return _getStore().getState()[name]?.byKey || {};
  };

  const sync = (items: T[]) => {
    return _getStore().dispatch(actions.multiSet(items));
  };

  const setQueries = (queries: Record<string, string[]>) => {
    return _getStore().dispatch(actions.setQueries(queries));
  };

  const multiDelete = (keys: string[]) => {
    return _getStore().dispatch(actions.multiDelete(keys));
  }

  const reset = () => {
    return _getStore().dispatch(actions.reset());
  };

  return {
    name,
    actions,
    reducer,
    useByKey,
    useKeysByQuery,
    getByKey,
    getKeysByQuery,
    getKeyByObjs,
    setStore,
    sync,
    setQueries,
    reset,
    multiDelete
  };
};
