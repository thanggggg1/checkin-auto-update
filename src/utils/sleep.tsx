export const timeSleep = async (seconds: number) => {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, seconds * 1000);
  });
  return
};