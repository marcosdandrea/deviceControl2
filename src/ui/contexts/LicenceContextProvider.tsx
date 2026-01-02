import useLicense, { UseLicenseType } from "@hooks/useLicense";
import React from "react";

export const LicenceContext = React.createContext(null);

export const LicenceContextProvider = ({children}) => {
    const licenseData = useLicense();

    // Lanzar la Promise mientras fetching sea true
    if (licenseData.fetching && licenseData.licensePromise) {
        throw licenseData.licensePromise;
    }

    return ( <LicenceContext.Provider value={licenseData as UseLicenseType}>
        {children}
    </LicenceContext.Provider> );
}
 
export default LicenceContextProvider;