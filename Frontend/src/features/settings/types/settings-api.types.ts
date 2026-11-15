import { UserSettings } from '@mailsense/types';
import { UseQueryOptions } from '@tanstack/react-query';

export type UseGetUseSettingsQueryOptions = Omit<UseQueryOptions<UserSettings, Error, UserSettings, [string]>, 'queryKey' | 'queryFn'>;
