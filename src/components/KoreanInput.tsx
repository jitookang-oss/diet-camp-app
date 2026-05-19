"use client";

import { useRef, InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// 한글 IME 조합 중 React controlled input 간섭 방지
export default function KoreanInput({ value, onChange, className, ...props }: Props) {
  const composing = useRef(false);

  return (
    <input
      {...props}
      className={className}
      value={value}
      onChange={(e) => {
        if (!composing.current) onChange(e.target.value);
      }}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={(e) => {
        composing.current = false;
        onChange((e.target as HTMLInputElement).value);
      }}
    />
  );
}
