import { DraftAttributes, DraftListDTO, SaveDraftRequestBody, SuccessAPIResponse } from '@mailsense/types';
import { EmailService } from '@modules/emails/email.service.js';
import { logger } from '@utils';
import { htmlToText } from 'html-to-text';
import { DraftDocument, DraftInput } from './draft.model.js';
import { DraftRepository } from './draft.repository.js';

export class DraftService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public async saveDraft(userId: string, payload: SaveDraftRequestBody): Promise<DraftAttributes> {
        try {
            const bodyPlain = payload.body ? htmlToText(payload.body, { wordwrap: false }).replace(/\s+/g, ' ').trim() : '';
            const draftInput: Partial<DraftInput> = {
                userId,
                accountId: payload.accountId,
                to: payload.to,
                cc: payload.cc,
                bcc: payload.bcc,
                subject: payload.subject,
                body: payload.body,
                bodyPlain,
                inReplyTo: payload.inReplyTo,
            };
            if (payload.draftId) {
                const draftDoc = await DraftRepository.updateDraft(payload.draftId, draftInput);
                return this.formatDraftDocument(draftDoc);
            } else {
                const draftDoc = await DraftRepository.createDraft(draftInput);
                return this.formatDraftDocument(draftDoc);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.saveDraft: ${errorMessage}`, { userId, payload, error });
            throw error;
        }
    }

    public async getDraftById(draftId: string, userId: string): Promise<DraftAttributes> {
        try {
            const draftDoc = await DraftRepository.getDraftById(draftId, userId);
            if (!draftDoc) {
                throw new Error(`Draft with ID ${draftId} not found`);
            }
            return this.formatDraftDocument(draftDoc);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.getDraftById: ${errorMessage}`, { draftId, userId, error });
            throw error;
        }
    }

    public async getUserDrafts(userId: string): Promise<DraftListDTO[]> {
        try {
            const draftDocs = await DraftRepository.getDraftsByUserId(userId);
            return draftDocs.map((doc) => {
                const rawPlain = doc.bodyPlain || (doc.body ? htmlToText(doc.body, { wordwrap: false }) : '');
                const cleanSnippet = rawPlain.replace(/\s+/g, ' ').trim().substring(0, 100);
                return {
                    _id: doc._id.toString(),
                    accountId: doc.accountId,
                    to: doc.to,
                    subject: doc.subject || '(No Subject)',
                    lastSavedAt: doc.lastSavedAt,
                    snippet: cleanSnippet,
                    bodyPlain: doc.bodyPlain,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                };
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.getUserDrafts: ${errorMessage}`, { userId, error });
            throw error;
        }
    }

    public async deleteDraft(draftId: string, userId: string): Promise<SuccessAPIResponse> {
        try {
            const deleted = await DraftRepository.deleteDraftById(draftId, userId);
            if (!deleted) {
                throw new Error(`Draft with ID ${draftId} not found or unauthorized`);
            }
            return { status: true, message: 'Draft deleted successfully' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.deleteDraft: ${errorMessage}`, { draftId, userId, error });
            throw error;
        }
    }

    public async sendDraft(draftId: string, userId: string): Promise<SuccessAPIResponse> {
        try {
            const draftDoc = await DraftRepository.getDraftById(draftId, userId);
            if (!draftDoc) {
                throw new Error(`Draft with ID ${draftId} not found or unauthorized`);
            }

            // Compose and send email via EmailService
            await this.emailService.composeEmail(userId, {
                accountId: draftDoc.accountId,
                to: draftDoc.to,
                subject: draftDoc.subject,
                body: draftDoc.body,
            });

            // Delete draft after successful sending
            await DraftRepository.deleteDraftById(draftId, userId);

            return { status: true, message: 'Draft sent successfully' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.sendDraft: ${errorMessage}`, { draftId, userId, error });
            throw error;
        }
    }

    private formatDraftDocument(doc: DraftDocument): DraftAttributes {
        try {
            return {
                _id: doc._id.toString(),
                userId: doc.userId,
                accountId: doc.accountId,
                providerDraftId: doc.providerDraftId,
                to: doc.to,
                cc: doc.cc,
                bcc: doc.bcc,
                subject: doc.subject,
                body: doc.body,
                bodyPlain: doc.bodyPlain,
                inReplyTo: doc.inReplyTo,
                attachments: doc.attachments,
                lastSavedAt: doc.lastSavedAt,
                syncedToProvider: doc.syncedToProvider,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error in DraftService.formatDraftDocument: ${errorMessage}`, { error });
            throw error;
        }
    }
}
