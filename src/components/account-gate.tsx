import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { checkAccount, signIn, signUp, type AuthState } from "@/lib/cloud";

/**
 * The sign-in screen. While the server runs nobody uses the lists without an account; when it
 * cannot be reached the page still works and keeps everything in this browser, as before
 * accounts. The side panel's look (panel grey, 14px inputs, ink button) so it reads as part of
 * the page; centred because it comes before everything else.
 */
export function AccountGate({ auth }: { auth: AuthState }) {
  const ref = useRef<HTMLDialogElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
