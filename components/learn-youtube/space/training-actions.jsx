"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children, className }) { const { pending } = useFormStatus(); return <button className={className} disabled={pending} type="submit">{pending ? "Sauvegarde..." : children}</button>; }
