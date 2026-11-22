// Keeps the local server's copy (MySQL) in step with this browser. The browser stays the first
// place everything is saved; the server gets a copy and hands it to another browser that knows the code.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ServerError, cleanCode, getState, isCode, loadCode, putState, saveCode } from "@/lib/cloud";
import type { Saved } from "@/lib/playlist";

export type SyncStatus = "checking" | "saving" | "saved" | "offline" | "nodb" | "error";

