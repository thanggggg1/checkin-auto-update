import useAsyncFn from "react-use/lib/useAsyncFn";
import { useEffect } from "react";

export const useAsyncEffect = <T>(fn: () => Promise<T>, deps: any[]) => {
  const [{loading, value, error}, call] = useAsyncFn(fn, deps);

  useEffect(() => {call()}, [call]);

  return {
    loading,
    value: value as T,
    error,
    call
  }
};

export default useAsyncEffect;
