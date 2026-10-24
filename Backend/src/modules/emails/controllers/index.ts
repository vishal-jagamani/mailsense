import { EmailMutationController } from './email-mutation.controller.js';
import { EmailQueryController } from './email-query.controller.js';

export const emailQueryController = new EmailQueryController();
export const emailMutationController = new EmailMutationController();

export { EmailMutationController, EmailQueryController };
