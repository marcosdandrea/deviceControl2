import appCommands from "@common/commands/app.commands";
import systemEvents from "@common/events/system.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useLicense = () => {
  const { emit, socket } = useContext(SocketIOContext);
  const [fetching, setFetching] = useState<boolean>(false);
  const [isLicensed, setIsLicensed] = useState<boolean | undefined>(undefined);
  const [systemFingerprint, setSystemFingerprint] = useState<string | null>(null);

  useEffect(() => {
    socket.on (systemEvents.appLicenseUpdated, () => {
        checkLicense();
    });
    return () => {
        socket.off (systemEvents.appLicenseUpdated);
    }
  }, [socket]);

  const checkLicense = async () => {
    emit(appCommands.checkLicense, null, ({ isValid, fingerprint }: { isValid: boolean; fingerprint: string | null }) => {
        setSystemFingerprint(fingerprint);
      setIsLicensed(isValid);
    });
  };

  const setLicense = async (licenseKey: string) => {
    return new Promise<boolean>((resolve) => {
      emit(appCommands.setLicense, { licenseKey }, (response: boolean) => {
        setIsLicensed(response);
        resolve(response);
      });
    });
  };

  useEffect(() => {
    setFetching(true);
    checkLicense().finally(() => setFetching(false));
  }, []);

  return { isLicensed, checkLicense, setLicense, systemFingerprint, fetching};
};

export default useLicense;
