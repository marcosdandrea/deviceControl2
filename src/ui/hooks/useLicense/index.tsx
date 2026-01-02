import appCommands from "@common/commands/app.commands";
import systemEvents from "@common/events/system.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useLicense = () => {
  const { emit, socket } = useContext(SocketIOContext);
  const [fetching, setFetching] = useState<boolean>(true);
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
      emit(appCommands.checkLicense, null, ({ isValid, fingerprint }: { isValid: boolean; fingerprint: string | null }) => {
        console.log("License check result:", { isValid, fingerprint });
        setSystemFingerprint(fingerprint);
        setIsLicensed(isValid);
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

  useEffect(() => {
    checkLicense();
  }, []);

  return { 
    isLicensed, 
    checkLicense, 
    setLicense, 
    systemFingerprint, 
    fetching,
    licensePromise
  };
};

export default useLicense;
