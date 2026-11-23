import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { hasStatus, UNREACHABLE_ON_SUBMIT } from "../../shared/api/client";
import { formatLessonDate } from "../../shared/format";
import { Button } from "../../shared/ui/Button";
import type { Lesson } from "../lessons/api";
import { cancelPaymentReads, invalidatePayments, setLessonPaid } from "./api";

export const LESSON_NOT_FOUND = "That lesson could not be found. Reload the page and try again.";

/** The alert text for a failed mark or undo, or undefined when the session ended (401). */
export function paidFailure(error: unknown): string | undefined {
  if (hasStatus(error, 401)) return undefined;
  return hasStatus(error, 404) ? LESSON_NOT_FOUND : UNREACHABLE_ON_SUBMIT;
}

const PAID_MUTATION_KEY = ["lesson-paid"] as const;

/** "Mark as paid" for an unpaid lesson, "Undo paid" for a paid one (F03 Behavior: Mark /
 * undo, In flight, Button names). While its request is in flight the button is disabled and
 * reads "Saving…"; each row has its own request, so other rows stay usable. When the request
 * settles the button takes focus again unless `onSaved` moved it elsewhere.
 *
 * `onSaved` gets the lesson as it was when clicked, so totals move by the request's own change.
 * No list or total read is in flight while a mark or undo is: reads are cancelled when one
 * starts and when it succeeds, and the refresh runs once the last pending one settles. */
export function PaidButton({
  lesson,
  onStart,
  onSaved,
  onFailed,
  buttonRef,
}: {
  lesson: Lesson;
  onStart: () => void;
  /** Returns true when it moved focus itself. */
  onSaved: (updated: Lesson, previous: Lesson) => boolean;
  onFailed: (message: string) => void;
  /** Receives the button element when it mounts and null when it unmounts. */
  buttonRef?: (element: HTMLButtonElement | null) => void;
}) {
  const queryClient = useQueryClient();
  const ownRef = useRef<HTMLButtonElement | null>(null);
  const refocus = useRef(false);
  const mutation = useMutation({
    mutationKey: PAID_MUTATION_KEY,
    mutationFn: ({ clicked, paid }: { clicked: Lesson; paid: boolean }) =>
      setLessonPaid(clicked, paid),
    onMutate: () => cancelPaymentReads(queryClient),
    onSuccess: async (updated, { clicked }) => {
      await cancelPaymentReads(queryClient);
      refocus.current = !onSaved(updated, clicked);
    },
    onError: (error) => {
      const message = paidFailure(error);
      if (message === undefined) return;
      onFailed(message);
      refocus.current = true;
    },
    onSettled: () => {
      // This mutation still counts as pending here.
      if (queryClient.isMutating({ mutationKey: PAID_MUTATION_KEY }) === 1) {
        invalidatePayments(queryClient);
      }
    },
  });
  useEffect(() => {
    if (!mutation.isPending && refocus.current) {
      refocus.current = false;
      ownRef.current?.focus();
    }
  });

  const action = lesson.paid ? "Undo paid" : "Mark as paid";
  const setRefs = (element: HTMLButtonElement | null) => {
    ownRef.current = element;
    buttonRef?.(element);
  };
  return (
    <Button
      ref={setRefs}
      variant="secondary"
      icon={mutation.isPending ? undefined : lesson.paid ? "undoPaid" : "markPaid"}
      disabled={mutation.isPending}
      aria-label={`${action}: ${lesson.student.name}, ${formatLessonDate(lesson.date)}`}
      onClick={() => {
        if (mutation.isPending) return;
        onStart();
        mutation.mutate({ clicked: lesson, paid: !lesson.paid });
      }}
    >
      {mutation.isPending ? "Saving…" : action}
    </Button>
  );
}
