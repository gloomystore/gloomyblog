import { useState, useEffect, useRef } from 'react'

function useFirstRender(callback: () => void, deps: any[]) {
  const isFirstRender = useRef(false)
  useEffect(() => {
    if (!isFirstRender.current) {
      callback()
      isFirstRender.current = true
    }
  }, deps)
}

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

interface TagProps {
  text: string
  remove: (text: string) => void
  disabled?: boolean
  className?: string
}

function Tag({ text, remove, disabled, className }: TagProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    remove(text)
  }

  return (
    <span className={classNames('glt--tag', className)}>
      <span>{text}</span>
      {!disabled && (
        <button type='button' onClick={handleClick} aria-label={`remove ${text}`}>
          &#10005;
        </button>
      )}
    </span>
  )
}

interface TagsInputProps {
  name?: string
  placeHolder?: string
  state: string[]
  setState: React.Dispatch<any>
  onChange?: (value: string[]) => void
  onBlur?: () => void
  separators?: string[]
  disableBackspaceRemove?: boolean
  onExisting?: (text: string) => void
  onRemoved?: (text: string) => void
  disabled?: boolean
  isEditOnRemove?: boolean
  beforeAddValidate?: (input: string, state: string[]) => boolean
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  classNames?: {
    tag?: string
    input?: string
  }
}

let timeout: number | undefined;

function GloomyTags({
  name,
  placeHolder,
  state,
  setState,
  onChange,
  onBlur,
  separators = [],
  disableBackspaceRemove = false,
  onExisting,
  onRemoved,
  disabled = false,
  isEditOnRemove = false,
  beforeAddValidate,
  onKeyUp,
  classNames,
}: TagsInputProps) {
  // const [state, setState] = useState<string[]>(value || [])
  const inputRef = useRef<HTMLInputElement>(null)

  useFirstRender(() => {
    setState && setState(state)
  }, [state])
  const ENTER_KEYS = ['Enter']
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if(timeout) return
    setTimeout(() => timeout = undefined , timeout)
    // const inputValue = event.currentTarget.value.trim()
    const inputValue = event.currentTarget.value.replace(/\s/gi, '')
    const key = event.key
    // console.log(event)
    // console.log(inputValue)
    if (inputValue && (separators.includes(key) || ENTER_KEYS.includes(key))) {
      event.preventDefault()

      if (beforeAddValidate && !beforeAddValidate(inputValue, state)) {
        return
      }

      // 한 글자인 경우 추가하지 않음
      if (inputValue.length === 1) {
        return event.currentTarget.value = ''
      }

      if (!state.includes(inputValue)) {
        setState([...state, inputValue])
        event.currentTarget.value = ''
      } else {
        onExisting && onExisting(inputValue)
      }
    }

    if (!inputValue && !disableBackspaceRemove && state.length && key === 'Backspace') {
      event.preventDefault()
      if (isEditOnRemove) {
        event.currentTarget.value = `${state.slice(-1)} `
      }
      setState([...state.slice(0, -1)])
    }
  }

  const handleTagRemove = (tag: string) => {
    setState(state.filter((t) => t !== tag))
    onRemoved && onRemoved(tag)
  }

  const [style, setStyle] = useState<string | null>(null);
  useEffect(() => {
    if (!style && typeof document === 'object') {
      setStyle(`
        .glt--container * {
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .glt--container {
          --glt-bg: #fff;
          --glt-border: #ccc;
          --glt-main: #3182ce;
          --glt-radius: 0.375rem;
          --glt-s: 0.5rem;
          --glt-tag: #edf2f7;
          --glt-tag-remove: #e53e3e;
          --glt-tag-padding: 0.15rem 0.25rem;
          align-items: center;
          background: var(--glt-bg);
          border: 1px solid var(--glt-border);
          border-radius: var(--glt-radius);
          display: flex;
          flex-wrap: wrap;
          gap: var(--glt-s);
          line-height: 1.4;
          padding: var(--glt-s);
          width: 400px;
          @media(max-width: 600px) {
            width: 100%;
          }
        }
        .glt--container:focus-within {
          border-color: var(--glt-main);
          box-shadow: var(--glt-main) 0 0 0 1px;
        }
        .glt--input {
          border: 0;
          outline: 0;
          font-size: inherit;
          line-height: inherit;
          width: 50%;
        }
        .glt--tag {
          align-items: center;
          background: var(--glt-tag);
          border-radius: var(--glt-radius);
          display: inline-flex;
          justify-content: center;
          padding: var(--glt-tag-padding);
        }
        .glt--tag button {
          background: none;
          border: 0;
          border-radius: 50%;
          cursor: pointer;
          line-height: inherit;
          padding: 0 var(--glt-s);
        }
        .glt--tag button:hover {
          color: var(--glt-tag-remove);
        }
      `);
    }
  }, [style])

  return (
    <div className='glt--container'>
      {state.map((tag) => (
        <Tag
          key={tag}
          className={classNames?.tag}
          text={tag}
          remove={handleTagRemove}
          disabled={disabled}
        />
      ))}
      <input
        className={`glt--input ${classNames?.input}`}
        type='text'
        name={name}
        placeholder={placeHolder}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        disabled={disabled}
        onKeyUp={onKeyUp}
        ref={inputRef}
      />
      <style>{style}</style>
    </div>
  )
}

export { GloomyTags }