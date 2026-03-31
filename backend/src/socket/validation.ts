import { z } from "zod";

const sessionPayloadSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required").max(191),
});

const sendMessagePayloadSchema = sessionPayloadSchema.extend({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(5000, "Message is too long"),
});

const codeChangePayloadSchema = sessionPayloadSchema.extend({
  code: z.string().max(200_000, "Code payload is too large"),
  language: z
    .enum(["javascript", "typescript", "python", "java", "cpp"])
    .optional()
    .default("javascript"),
});

const webRtcSessionDescriptionSchema = z
  .object({
    type: z.string().trim().max(32).optional(),
    sdp: z.string().max(200_000).optional(),
  })
  .passthrough();

const webRtcIceCandidateSchema = z
  .object({
    candidate: z.string().max(10_000).optional(),
    sdpMid: z.string().trim().max(255).nullable().optional(),
    sdpMLineIndex: z.number().int().nullable().optional(),
    usernameFragment: z.string().trim().max(255).nullable().optional(),
  })
  .passthrough();

const webRtcOfferPayloadSchema = sessionPayloadSchema.extend({
  offer: webRtcSessionDescriptionSchema,
});

const webRtcAnswerPayloadSchema = sessionPayloadSchema.extend({
  answer: webRtcSessionDescriptionSchema,
});

const webRtcIceCandidatePayloadSchema = sessionPayloadSchema.extend({
  candidate: webRtcIceCandidateSchema,
});

export type SessionEventPayload = z.infer<typeof sessionPayloadSchema>;
export type SendMessageEventPayload = z.infer<typeof sendMessagePayloadSchema>;
export type CodeChangeEventPayload = z.infer<typeof codeChangePayloadSchema>;
export type WebRtcOfferEventPayload = z.infer<typeof webRtcOfferPayloadSchema>;
export type WebRtcAnswerEventPayload = z.infer<typeof webRtcAnswerPayloadSchema>;
export type WebRtcIceCandidateEventPayload = z.infer<
  typeof webRtcIceCandidatePayloadSchema
>;

export function parseSessionEventPayload(input: unknown) {
  return sessionPayloadSchema.parse(input);
}

export function parseSendMessageEventPayload(input: unknown) {
  return sendMessagePayloadSchema.parse(input);
}

export function parseCodeChangeEventPayload(input: unknown) {
  return codeChangePayloadSchema.parse(input);
}

export function parseWebRtcOfferEventPayload(input: unknown) {
  return webRtcOfferPayloadSchema.parse(input);
}

export function parseWebRtcAnswerEventPayload(input: unknown) {
  return webRtcAnswerPayloadSchema.parse(input);
}

export function parseWebRtcIceCandidateEventPayload(input: unknown) {
  return webRtcIceCandidatePayloadSchema.parse(input);
}
