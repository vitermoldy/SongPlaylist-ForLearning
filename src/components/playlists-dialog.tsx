import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Play, Trash2 } from "lucide-react";
import { Confirm, Sheet } from "@/components/sheet";
import type { SavedPlaylist, Song } from "@/lib/playlist";
import { thumbUrl } from "@/lib/youtube";

