import { AccountsMutationController } from './accounts-mutation.controller.js';
import { AccountsQueryController } from './accounts-query.controller.js';

export const accountsQueryController = new AccountsQueryController();
export const accountsMutationController = new AccountsMutationController();
