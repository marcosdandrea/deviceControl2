import React from "react";
import { InputNumber, Space } from "antd";
import style from "./style.module.css";

type Ipv4 = {
    placeholder?: string;
    compoundIpv4?: number[];
    setCompoundIpv4?: (value: number[]) => void;
    isValid?: boolean;
    disabled?: boolean;
}

const Ipv4Input = ({placeholder, compoundIpv4=[0, 0, 0, 0], setCompoundIpv4, isValid, disabled}: Ipv4) => {
    const frag1Ref = React.useRef(null);
    const frag2Ref = React.useRef(null);
    const frag3Ref = React.useRef(null);
    const frag4Ref = React.useRef(null);

    const updateValue = (index, value: number) => {
        const newIpv4 = [...compoundIpv4];
        newIpv4[index] = value;
        setCompoundIpv4?.(newIpv4);
    }

    const handleOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (event.key === '.') {
            event.preventDefault();
            switch (index) {
                case 0:
                    frag2Ref.current?.focus();
                    frag2Ref.current?.select();
                    break;
                case 1:
                    frag3Ref.current?.focus();
                    frag3Ref.current?.select();
                    break;
                case 2:
                    frag4Ref.current?.focus();
                    frag4Ref.current?.select();
                    break;
                default:
                    break;
            }
        }
    }

    return (
        <Space>
            <InputNumber 
                disabled={disabled}
                ref={frag1Ref}
                placeholder={placeholder?.split('.')[0] ?? "0"}
                controls={false}
                className={style.ipv4Fragment}  
                value={compoundIpv4?.[0] ?? 0}
                onKeyDown={(event) => handleOnKeyDown(event, 0)}
                onChange={(value) => updateValue(0, value)}
                status={isValid ? undefined : "error"}
                min={0} 
                max={255} />
            .
            <InputNumber 
                disabled={disabled}
                ref={frag2Ref}
                placeholder={placeholder?.split('.')[1] ?? "0"}
                controls={false}
                className={style.ipv4Fragment}
                value={compoundIpv4?.[1] ?? 0}
                onKeyDown={(event) => handleOnKeyDown(event, 1)}
                onChange={(value) => updateValue(1, value)}
                status={isValid ? undefined : "error"}
                min={0} 
                max={255} />
            .
            <InputNumber 
                disabled={disabled}
                ref={frag3Ref}
                placeholder={placeholder?.split('.')[2] ?? "0"}
                controls={false}
                className={style.ipv4Fragment}
                onKeyDown={(event) => handleOnKeyDown(event, 2)}
                value={compoundIpv4?.[2] ?? 0}
                onChange={(value) => updateValue(2, value)}
                status={isValid ? undefined : "error"}
                min={0} 
                max={255} />
            .
            <InputNumber 
                disabled={disabled}
                ref={frag4Ref}
                placeholder={placeholder?.split('.')[3] ?? "0"}
                controls={false}
                className={style.ipv4Fragment}
                onKeyDown={(event) => handleOnKeyDown(event, 3)}
                value={compoundIpv4?.[3] ?? 0}
                onChange={(value) => updateValue(3, value)}
                status={isValid ? undefined : "error"}
                min={0} 
                max={255} />
        </Space>
    );
}

export default Ipv4Input;