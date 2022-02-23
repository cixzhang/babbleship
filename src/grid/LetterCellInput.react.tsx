
import { KeyboardEvent } from 'react';
import styled, {css} from 'styled-components';

interface LetterCellProps {
  isInvalid: boolean,
  isWordBase?: boolean,
  isOnActivePath: boolean,
  isTabbable: boolean,
  value: string;
  placeholder: string,
  onBackspace: () => void,
  onFocus: () => void,
  onSubmit: () => void,
  onInput: (character: string) => void,
  onSpace: () => void,
  onArrowKey: (move: 'up' | 'down' | 'left' | 'right') => void,
}
export default function LetterCell({
  isInvalid,
  isWordBase,
  isOnActivePath,
  isTabbable,
  value,
  placeholder,
  onBackspace,
  onFocus,
  onSubmit: onSubmitFromProps,
  onInput: onInputFromProps,
  onSpace,
  onArrowKey,
}: LetterCellProps): JSX.Element {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();
    e.preventDefault();
    switch (key) {
      case ' ':
        e.preventDefault(); // prevent inputting spaces
        onSpace();
        return;
      case 'backspace':
        onBackspace();
        return;
      case 'arrowup':
        onArrowKey('up');
        return;
      case 'arrowleft':
        onArrowKey('left');
        return;
      case 'arrowdown':
        onArrowKey('down');
        return;
      case 'arrowright':
        onArrowKey('right');
        return;
      case 'enter':
        onSubmitFromProps();
        return;
      default:
        if (ALPHA.has(key)) {
          onInputFromProps(key.toUpperCase());
        }
        return;
    }
  };

  return <StyledInput
    type="text"
    placeholder={placeholder}
    maxLength={1}
    tabIndex={isTabbable ? 0 : -1}
    value={value}
    onFocus={onFocus}
    onKeyDown={onKeyDown}
    onChange={() => {}}
    // CSS
    isOnActivePath={isOnActivePath}
    isWordBase={isWordBase}
    isInvalid={isInvalid}
  />;
}

const ALPHA = new Set('abcdefghijklmnopqrstuvwxyz');

const StyledInput = styled.input<{isOnActivePath: boolean, isInvalid: boolean, isWordBase?: boolean}>`
  background: transparent;
  border: 2px solid lightgrey;
  border-radius: 5px;
  caret-color: transparent;
  color: inherit;
  font-size: 40px;
  height: 60px;
  outline: none;
  text-align: center;
  width: 60px;

  ::placeholder {
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }

  ${props => props.isOnActivePath && !props.isWordBase && css`
    border-color: royalblue;
  `}

  ${props => props.isOnActivePath && props.isWordBase && css`
    border-color: darkblue;
  `}

  ${props => props.isInvalid && css`
    border-color: red;
    background-color: mistyrose;
  `}
`;
