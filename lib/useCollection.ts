"use client";

import { useSyncExternalStore } from "react";
import {
  getCollectionServerSnapshot,
  getCollectionSnapshot,
  subscribeCollection,
} from "./collectionShare";

/** This device's saved-Cut working set, kept in sync with localStorage. */
export function useCollection(): string[] {
  return useSyncExternalStore(subscribeCollection, getCollectionSnapshot, getCollectionServerSnapshot);
}
