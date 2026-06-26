import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

/**
 * Wraps `zodResolver` and casts it to the form's output type.
 *
 * Needed because zod v4 `z.coerce.*` schemas have an input type of `unknown`,
 * which otherwise breaks react-hook-form's generic inference. At runtime the
 * resolver still coerces values correctly before they reach `onSubmit`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodFormResolver<T extends FieldValues>(schema: any): Resolver<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return zodResolver(schema) as unknown as Resolver<T>;
}
