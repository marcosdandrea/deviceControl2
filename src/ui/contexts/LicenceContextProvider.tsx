import useLicense from "@hooks/useLicense";
import React, { useMemo } from "react";

export const LicenceContext = React.createContext(null);

export const LicenceContextProvider = ({children}) => {
    const {isLicensed, fetching, systemFingerprint, licensePromise} = useLicense();

    // Lanzar la Promise mientras fetching sea true
    if (fetching && licensePromise) {
        throw licensePromise;
    }

    return ( <LicenceContext.Provider value={{isLicensed, fetching, systemFingerprint}}>
        {children}
    </LicenceContext.Provider> );
}
 
export default LicenceContextProvider;