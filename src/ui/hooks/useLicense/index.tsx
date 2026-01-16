import appCommands from "@common/commands/app.commands";
import systemEvents from "@common/events/system.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { LicenseInformation } from "@src/services/licensing";
import { useContext, useEffect, useState } from "react";

export type UseLicenseType = {
  isLicensed: boolean | undefined;
  checkLicense: () => Promise<void>;
  setLicense: (licenseKey: string) => Promise<boolean>;
  deleteLicenseFile: () => Promise<boolean>;
  systemFingerprint: string | null;
  fetching: boolean;
  licensePromise: Promise<void> | null;
  createdAt: string | null;
  expiresAt: string | null;
  data: any;
};

const useLicense = () => {
  const { emit, socket } = useContext(SocketIOContext);
  const [fetching, setFetching] = useState<boolean>(true);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isLicensed, setIsLicensed] = useState<boolean | undefined>(false);
  const [systemFingerprint, setSystemFingerprint] = useState<string | null>(null);
  const [licensePromise, setLicensePromise] = useState<Promise<void> | null>(null);

  useEffect(() => {
    socket.on (systemEvents.appLicenseUpdated, () => {
        checkLicense();
    });
    return () => {
        socket.off (systemEvents.appLicenseUpdated);
    }
  }, [socket]);

  const checkLicense = async () => {
    setFetching(true);



    const promise = new Promise<void>((resolve) => {
      emit(appCommands.checkLicense, null, ({ isValid, fingerprint, expiresAt, createdAt, data }: LicenseInformation) => {
        console.log("License check result:", { isValid, fingerprint });
        setSystemFingerprint(fingerprint);
        setIsLicensed(isValid);
        setExpiresAt(expiresAt);
        setCreatedAt(createdAt);
        setData(data);
        setFetching(false);
        resolve();
      });
    });
    setLicensePromise(promise);
    return promise;
  };

  const setLicense = async (licenseKey: string) => {
    return new Promise<boolean>((resolve) => {
      setFetching(true);
      emit(appCommands.setLicense, { licenseKey }, (response: boolean) => {
        setIsLicensed(response);
        setFetching(false);
        resolve(response);
      });
    });
  };

  const deleteLicenseFile = async () => {
    return new Promise<boolean>((resolve) => {
      setFetching(true);
      emit(appCommands.deleteLicense, null, (response: boolean) => {
        if (typeof response === 'object' && response?.error) {
          console.error("Error deleting license:", response.error);
          return
        }
        setIsLicensed(false);
        setFetching(false);
        resolve(response);
      });
    });
  }

  useEffect(() => {
    checkLicense();
  }, []);

  return { 
    isLicensed, 
    checkLicense, 
    setLicense, 
    deleteLicenseFile,
    systemFingerprint, 
    fetching,
    licensePromise,
    createdAt,
    expiresAt,
    data,
  } as UseLicenseType;
};

export default useLicense;
