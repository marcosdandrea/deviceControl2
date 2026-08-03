import React from "react";
import { WifiContext, wifiContextType } from "../../context";
import style from "./style.module.css";
import Text from "@components/Text";
import { BsWifi, BsWifi1, BsWifi2, BsWifiOff } from "react-icons/bs";
import { List, Skeleton } from "antd";
import { FaLock } from "react-icons/fa6";
import { Logger } from "@helpers/logger";

const WifiSsidList = () => {
    const { availableNetworks, ssid } = React.useContext(WifiContext) as wifiContextType

    const handleOnClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        Logger.log(e.currentTarget.getAttribute("data-value"));

    };

    // Ordenar redes: conexión activa primero, luego el resto por señal
    const sortedNetworks = React.useMemo(() => {
        return [...availableNetworks].sort((a, b) => {
            // La red en uso siempre va primero
            if (a.inUse && !b.inUse) return -1;
            if (!a.inUse && b.inUse) return 1;
            // Si ninguna está en uso, ordenar por señal (mayor a menor)
            return b.signal - a.signal;
        });
    }, [availableNetworks]);

    return (
        <div className={style.wifiSelect}>
            <List
                className={style.wifiList}
                style={{
                    overflowY: sortedNetworks.length !== 0 ? "auto" : "hidden"
                }}
                size="small">
                {
                    sortedNetworks.length === 0
                        ? <Skeleton 
                            style={{padding: "0 1rem"}}
                            active 
                            title={false}
                            paragraph={{ rows: 10 }} />
                        : sortedNetworks.map(network => {

                            const isSelected = ssid.value?.ssid === network.ssid;

                            return (<List.Item
                                data-value={network.ssid}
                                onClickCapture={handleOnClick}
                                key={network.ssid}
                                className={`${style.wifiOption} ${isSelected ? style.wifiOptionSelected : ""}`}
                                onClick={() => ssid.set(network)}>
                                <div className={style.SSIDName}>
                                    <Text className={style.wifiOption}>
                                        {network.ssid}
                                    </Text>
                                    {network.security != "Open" && <FaLock size={12} className={style.lockIcon} />}
                                </div>
                                <Text className={style.wifiOption}>
                                    {network.inUse ? "Conectado" : ""}
                                </Text>
                                {
                                    network.signal > 70
                                        ? <BsWifi size={20} color={isSelected ? "white" : "green"} />
                                        : network.signal > 40
                                            ? <BsWifi2 size={20} color={isSelected ? "white" : "orange"} />
                                            : <BsWifi1 size={20} color={isSelected ? "white" : "red"} />
                                }
                            </List.Item>)
                        }
                        )}
            </List>
        </div>
    );
}

export default WifiSsidList;
