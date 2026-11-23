import { seed } from "./stack";

/** Loads the seed accounts (alice, bob, carol) once, before any spec file runs. */
export default function globalSetup(): void {
  seed();
}
