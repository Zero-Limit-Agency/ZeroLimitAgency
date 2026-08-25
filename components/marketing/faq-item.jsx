"use client";
import { Icon } from "./icons";
export function FAQItem({ question, children }) { return <details className="zl-faq-item"><summary><span>{question}</span><Icon name="chevron"/></summary><p>{children}</p></details>; }
