import liff from "@line/liff";

export const initLiff = async (): Promise<void> => {
  const liffId = import.meta.env.VITE_LINE_LIFF_ID;
  if (!liffId) {
    throw new Error("VITE_LINE_LIFF_ID is not configured");
  }
  
  await liff.init({ liffId });
};

export const isLiffLoggedIn = (): boolean => {
  return liff.isLoggedIn();
};

export const liffLogin = (): void => {
  liff.login();
};

export const liffLogout = (): void => {
  liff.logout();
};

export const getLiffIdToken = async (): Promise<string | null> => {
  if (!liff.isLoggedIn()) {
    return null;
  }
  return liff.getIDToken();
};

export const getLiffProfile = async () => {
  if (!liff.isLoggedIn()) {
    return null;
  }
  return liff.getProfile();
};

export { liff };
