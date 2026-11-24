import { useFetchEmailFilters } from '@features/inbox/api/inbox.queries';
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY, FILTER_OPTION_TYPE, FilterOption } from '@mailsense/types';
import { DATE_RANGE_DROPDOWN_OPTIONS } from '@shared/constants';
import { useMemo } from 'react';

export const useInboxPageFilterOptions = (accountId?: string) => {
    const { data: emailFilters, isLoading: isLoadingEmailFilters } = useFetchEmailFilters();

    const emailFilterOptions: FilterOption[] | undefined = useMemo(() => {
        if (!emailFilters) return undefined;
        return [
            ...(!accountId
                ? [
                      {
                          id: 1,
                          name: 'accountId',
                          type: FILTER_OPTION_TYPE.DROPDOWN,
                          label: 'Accounts',
                          data:
                              emailFilters.accounts?.map((acc) => ({
                                  id: acc.id,
                                  name: acc.id,
                                  label: acc.emailAddress,
                                  provider: acc.provider,
                                  selectedValue: '',
                              })) || [],
                      },
                  ]
                : []),
            {
                id: 2,
                name: 'folders',
                label: 'Folders',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data:
                    emailFilters.folders?.map((folder) => ({
                        id: folder.id,
                        name: folder.id,
                        label: folder.name,
                        selectedValue: '',
                    })) || [],
            },
            {
                id: 3,
                name: 'dateRange',
                label: 'Date Range',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data: DATE_RANGE_DROPDOWN_OPTIONS.map((item) => ({
                    id: item.name,
                    name: item.name,
                    label: item.label,
                    selectedValue: '',
                })),
            },
            {
                id: 4,
                name: 'unread',
                label: 'Unread',
                type: FILTER_OPTION_TYPE.TOGGLE,
                data: { id: 'unread', name: 'unread', label: 'Unread', selectedValue: false },
            },
            {
                id: 5,
                name: 'aiCategory',
                label: 'AI Category',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data: Object.values(EMAIL_AI_CATEGORY).map((cat) => ({
                    id: cat,
                    name: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    selectedValue: '',
                })),
            },
            {
                id: 6,
                name: 'aiPriority',
                label: 'AI Priority',
                type: FILTER_OPTION_TYPE.DROPDOWN,
                data: Object.values(EMAIL_AI_PRIORITY).map((prio) => ({
                    id: prio,
                    name: prio,
                    label: prio.charAt(0).toUpperCase() + prio.slice(1),
                    selectedValue: '',
                })),
            },
        ];
    }, [emailFilters, accountId]);

    return { emailFilterOptions: { data: emailFilterOptions, loading: isLoadingEmailFilters } };
};
