import { useEffect } from "react";
import { message } from "antd";
import convertZklibErrorToMessage from "../utils/convertZklibErrorToMessage";

const useAutoMessageError = (error?: Error, duration = 5) => {
  useEffect(() => {
    if (!error) return;

    message.error(convertZklibErrorToMessage(error), duration);
  }, [error]);
};

export default useAutoMessageError;
