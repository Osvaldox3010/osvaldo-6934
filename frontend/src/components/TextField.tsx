type TextFieldProps = {
    id: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    value: string;
    error?: string;
    autoComplete?: string;
    onChange: (value: string) => void;
};

export function TextField({ id, label, type = 'text', value, error, onChange }: TextFieldProps) {
    return (
        <div>
            <label htmlFor={id}> {label} </label>
            <input
                id = {id}
                type = {type}
                value = {value}
                onChange = {(event) => onChange(event.target.value)}
                aria-invalid = {error !== undefined}
                aria-describedBy = {error !== undefined ? `${id}-error`: undefined}
                />
                {error !== undefined && 
                    <p id = {`${id}-error`} role="alert">
                        {error}
                    </p>}
        </div>
    );
}