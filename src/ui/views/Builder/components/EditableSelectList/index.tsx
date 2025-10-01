import React, { useEffect, useState } from "react"
import style from "./style.module.css"
import { Button, Input, message, Select, Space } from "antd"
import { MdAdd, MdEdit } from "react-icons/md";
import { nanoid } from "nanoid";

interface EditableSelectListProps {
    label: string;
    options: { label: string; value: string; }[];
    createNewOptionLabel?: string;
    onCreateOption: (options: { label: string; value: string; }[], newOption: { label: string; value: string; }) => void;
    onUpdateOption?: (options: { label: string; value: string; }[], updatedOption: { label: string; value: string; }) => void;
    onSelectOption?: (value: string, option: any) => void;
    value?: { label: string; value: string; } | null;
}

function EditableSelectList(props: EditableSelectListProps) {
    const selectRef = React.createRef<any>();
    const [editMode, setEditMode] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        selectRef.current?.blur()
    }, [props.value])

    useEffect(() => {
        const valueExists = props.options.find(opt => opt.value === props.value?.value);
        setCanEdit(!!valueExists);
    }, [props.value, props.options]);

    const handleOnSelect = (value: string, option: any) => {
        props.onSelectOption?.(value, option.label);
    };

    const checkIfOptionExists = (value: string) => {
        return props.options.some(opt => opt.label === value);
    }

    const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchValue.trim() !== "") {
            if (checkIfOptionExists(searchValue)) {
                message.warning("Ya existe un elemento con ese nombre");
            } else {
                createNewOption();
            }
        }
    };

    const createNewOption = () => {

        if (searchValue.trim() === ""){
            message.warning("El nombre no puede estar vacío");
            return;
        }

        if (checkIfOptionExists(searchValue)) {
            message.warning("Ya existe un elemento con ese nombre");
            return;
        }

        const newOption = { label: searchValue, value: nanoid(8) };
        props.onUpdateOption([...props.options, newOption], newOption);
    };

    const AddNewOption = (
        <div>
            <Button
                type="primary"
                className={style.createNewOption}
                onClick={createNewOption}>
                <MdAdd size={18} color="var(--white)" /> {props.createNewOptionLabel}
            </Button>
        </div>
    )

    const updateValueLabel = () => {
        if (editValue.trim() === "")
            return;

        if (checkIfOptionExists(editValue)) {
            message.warning("Ya existe un elemento con ese nombre");
            return;
        }

        if (props.value) {
            const updatedOption = { label: editValue, value: props.value.value };
            const updatedOptions = props.options.map(opt => opt.value === props.value?.value ? updatedOption : opt);
            if (editMode)
                props.onUpdateOption(updatedOptions, updatedOption);
            else
                props.onCreateOption(updatedOptions, updatedOption);
        }
        setEditMode(false);
    }

    const handleOnSearching = (value: string) => {
        setSearchValue(value);
    }

    const handleOnInputBlurs = () => {
        updateValueLabel();
    };

    const handleOnChangingTriggerName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    const handleOnEnableEditNameMode = () => {
        setEditMode(true);
        setEditValue(props.value?.label || "");
    };

    return (
        <Space.Compact>
            <Input
                style={{
                    width: '80px',
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--component-interactive)",
                    pointerEvents: 'none',
                    borderRight: 0,
                }}
                value={props.label}
                readOnly
                tabIndex={-1} />
            {editMode ?
                <Input
                    style={{ width: 'calc(100% - 80px - 40px)' }}
                    value={editValue}
                    autoFocus
                    onBlur={handleOnInputBlurs}
                    onPressEnter={handleOnInputBlurs}
                    onChange={handleOnChangingTriggerName} />
                :
                <Select
                    ref={selectRef}
                    autoClearSearchValue={false}
                    showSearch
                    notFoundContent={AddNewOption}
                    optionFilterProp="label"
                    placeholder="Seleccione un disparador o escriba un nombre para crear uno nuevo"
                    onKeyDown={handleOnKeyDown}
                    onSelect={handleOnSelect}
                    onSearch={handleOnSearching}
                    value={props.value?.value}
                    style={{ width: 'calc(100% - 80px - 40px)' }}
                    options={props.options} />}
            <Button
                disabled={!canEdit}
                onClick={handleOnEnableEditNameMode}
                title="Editar nombre del disparador"
                style={{ width: '40px', padding: 10, marginLeft: 1 }}>
                <MdEdit size={16} color="var(--text-secondary)" />
            </Button>
        </Space.Compact>
    );
}


export default EditableSelectList;