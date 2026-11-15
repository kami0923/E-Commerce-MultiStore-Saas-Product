"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput({ containerClassName = "", className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { containerClassName?: string }) {
  const [visible, setVisible] = useState(false);
  return <span className={`relative block ${containerClassName}`}><input {...props} type={visible ? "text" : "password"} className={`${className} pr-12`} /><button type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#758178] transition hover:bg-[#edf2eb] hover:text-[#164b36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e9278]"><span className="sr-only">{visible ? "Hide password" : "Show password"}</span>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>;
}
