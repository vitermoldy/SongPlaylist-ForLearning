import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { checkAccount, signIn, signUp, type AuthState } from "@/lib/cloud";

/**
