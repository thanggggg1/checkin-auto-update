import { useMemo, useState } from "react";

export const useBoolean = (initial: boolean = false) => {
  const [value, setValue] = useState(initial);

  return [
    value,
    ...useMemo(() => [() => setValue(true), () => setValue(false)], []),
  ] as [boolean, () => void, () => void];
};

export default useBoolean;
