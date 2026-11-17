export const publicationStatuses = [
  "draft",
  "published",
  "scheduled",
  "unpublished",
  "archived"
] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];

export const allowedPublicationTransitions: Record<PublicationStatus, PublicationStatus[]> = {
  draft: ["published", "scheduled", "archived"],
  scheduled: ["published", "unpublished", "archived"],
  published: ["unpublished", "archived"],
  unpublished: ["published", "archived"],
  archived: []
};

export const canTransitionPublicationStatus = (
  from: PublicationStatus,
  to: PublicationStatus
): boolean => from === to || allowedPublicationTransitions[from].includes(to);
