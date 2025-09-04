const logEvents = [];

export const log = (message, type = "INFO") => {
  const entry = {
    message,
    type,
    timestamp: new Date().toISOString(),
  };
  logEvents.push(entry);
};


export const getLogs = () => logEvents;
