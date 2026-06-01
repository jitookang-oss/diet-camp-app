"use client";

import { useRef, useState, useEffect, InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// 한글 IME 조합 중 React controlled input 간섭 방지
// 로컬 state로 DOM 값을 직접 관리 → 조합 중 리렌더링에도 입력값 유지
export default function KoreanInput({ value, onChange, className, ...props }: Props) {
  const composing = useRef(false);
  const [localValue, setLocalValue] = useState(value);

  // 외부 value가 바뀔 때만 로컬 동기화 (조합 중에는 건드리지 않음)
  useEffect(() => {
    if (!composing.current) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <input
      {...props}
      className={className}
      value={localValue}
      onChange={(e) => {
        const val = e.target.value;
        setLocalValue(val); // 조합 중에도 로컬 state는 항상 업데이트 → 리렌더링 시 값 유지
        if (!composing.current) onChange(val);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={(e) => {
        composing.current = false;
        const val = (e.target as HTMLInputElement).value;
        setLocalValue(val);
        onChange(val);
      }}
    />
  );
}
