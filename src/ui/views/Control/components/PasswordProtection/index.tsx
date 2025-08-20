import React, { useContext, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { ProjectContext } from '@contexts/projectContextProvider';
import PasswordPad from './components/PasswordPad';

const PasswordProtection = ({ children }) => {
    const blockingTime = 20000
    const divRef = useRef<HTMLDivElement | null>(null);
    const blockTimerRef = useRef<number | null>(null);
    const { project } = useContext(ProjectContext)
    const [password, setPassword] = useState('');
    const [lastTouch, setLastTouch] = useState<number>(0);
    const [blockView, setBlockView] = useState<boolean>(false);
    const [showPasswordPad, setShowPasswordPad] = useState<boolean>(false);

    useEffect(() => {
        if (project) {
            setPassword(project.password);
        }
    }, [project])

    useEffect(() => {
        if (!password) {
            setShowPasswordPad(false);
            setBlockView(false);
            return
        }

        if (lastTouch != null) {
            blockTimerRef.current = setTimeout(() => {
                setLastTouch(null);
                setBlockView(true);
            }, blockingTime);
        }

        return () => {
            if (blockTimerRef.current) {
                clearTimeout(blockTimerRef.current);
            }
        };
    }, [lastTouch, password])

    const registerTouch = () => {
        if (!blockView) {
            setLastTouch(Date.now());
            setShowPasswordPad(false);
        } else {
            if (!showPasswordPad) {
                setShowPasswordPad(true);
            }else{
                setShowPasswordPad(false);
            }
        }
    }

    const handleOnPasswordConfirm = (password: string) => {
        if (password === project.password) {
            setBlockView(false);
            setShowPasswordPad(false);
            setLastTouch(Date.now());
        } else {
            setBlockView(true);
            setShowPasswordPad(false);
        }
    }


    return (
        <div
            ref={divRef}
            onMouseDown={registerTouch}
            onTouchEnd={registerTouch}
            className={style.passwordProtection}>
            {showPasswordPad &&
                <PasswordPad 
                    onConfirm={handleOnPasswordConfirm}
                    onCancel={() => setShowPasswordPad(false)}
                />
            }
            <div
                style={{
                    pointerEvents: blockView ? 'none' : 'auto',
                    opacity: blockView ? 0.5 : 1,
                }}
                className={style.childrenContainer}>
                {children}
            </div>
        </div>
    );
}

export default PasswordProtection;