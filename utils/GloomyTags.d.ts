import React from 'react';

interface TagsInputProps {
    name?: string;
    placeHolder?: string;
    state?: string[];
    setState: React.Dispatch<any>
    onChange?: (tags: string[]) => void;
    onBlur?: any;
    separators?: string[];
    disableBackspaceRemove?: boolean;
    onExisting?: (tag: string) => void;
    onRemoved?: (tag: string) => void;
    disabled?: boolean;
    isEditOnRemove?: boolean;
    beforeAddValidate?: (tag: string, existingTags: string[]) => boolean;
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    classNames?: {
        input?: string;
        tag?: string;
    };
}
declare const GloomyTags: ({ name, placeHolder, state, setState, onChange, onBlur, separators, disableBackspaceRemove, onExisting, onRemoved, disabled, isEditOnRemove, beforeAddValidate, onKeyUp, classNames, }: TagsInputProps) => JSX.Element;

export { GloomyTags, TagsInputProps };
