import type { ApplicationStatus } from '@/components/ApplicationStatus';

/** One entry of an application's timeline. `kind` + `detail` only — the
 *  sentence is rendered client-side so it follows the user's language. */
export interface ApplicationEvent {
  id: string;
  kind: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

/** Mirrors JobApplicationSerializer (applications/serializers.py). */
export interface JobApplication {
  id: string;
  cvId: string;
  cvTitle: string;
  jobTitle: string;
  companyName: string;
  jobOfferText: string;
  language: string;
  generatedCoverLetter: string;
  generatedEmailSubject: string;
  generatedEmailBody: string;
  recipientEmail: string;
  senderEmail: string;
  emailSentAt: string | null;
  status: ApplicationStatus;
  statusChangedAt: string | null;
  followUpAt: string | null;
  followUpNote: string;
  followUpHandledAt: string | null;
  /** Set only when the user deliberately scheduled a send for later. */
  scheduledSendAt: string | null;
  /** 'scheduled' and 'retrying' are both pending, but only one was asked for. */
  sendState: 'idle' | 'scheduled' | 'retrying' | 'failed';
  sendError: string;
  followUpSubject: string;
  followUpBody: string;
  followUpSentAt: string | null;
  events: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

/** A due follow-up, as returned by GET /applications/notifications/. */
export interface FollowUpNotification {
  id: string;
  jobTitle: string;
  companyName: string;
  followUpAt: string;
  followUpNote: string;
  emailSentAt: string | null;
  daysSinceSent: number | null;
  hasRelance: boolean;
}
