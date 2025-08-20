import React from 'react';
import style from './style.module.css';
import Button from '@components/Button';
import { MdArrowBack, MdCheck } from 'react-icons/md';
import { Color } from '@common/theme/colors';
import Text from '@components/Text';

const PasswordPad = ({ onConfirm, onCancel }: { onConfirm: (password: string) => void, onCancel: () => void }) => {
    const [input, setInput] = React.useState<string>("");

    const handleOnInput = (value: string, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setInput(prev => prev + value);
    }

    const handleOnCancel = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setInput("");
        onCancel();
    }

    const handleOnConfirm = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onConfirm(input);
    }

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={style.passwordPad}>
            <div className={style.padContainer}>
                <div className={style.titleContainer}>
                <Text
                    text="Password"
                    style={{
                        width: "auto"
                    }}
                    color={Color.white}/>
                </div>
                <div className={style.padRow}>
                    <Button text="1" onClick={(e) => handleOnInput("1", e)} />
                    <Button text="2" onClick={(e) => handleOnInput("2", e)} />
                    <Button text="3" onClick={(e) => handleOnInput("3", e)} />
                </div>
                <div className={style.padRow}>
                    <Button text="4" onClick={(e) => handleOnInput("4", e)} />
                    <Button text="5" onClick={(e) => handleOnInput("5", e)} />
                    <Button text="6" onClick={(e) => handleOnInput("6", e)} />
                </div>
                <div className={style.padRow}>
                    <Button text="7" onClick={(e) => handleOnInput("7", e)} />
                    <Button text="8" onClick={(e) => handleOnInput("8", e)} />
                    <Button text="9" onClick={(e) => handleOnInput("9", e)} />
                </div>
                <div className={style.padRow}>
                    <Button icon={<MdArrowBack color={Color.white} />} color={Color.red} onClick={handleOnCancel} />
                    <Button text="0" onClick={(e) => handleOnInput("0", e)} />
                    <Button icon={<MdCheck color={Color.black} />} color={Color.green} onClick={handleOnConfirm} />
                </div>
            </div>
        </div>);
}

export default PasswordPad;