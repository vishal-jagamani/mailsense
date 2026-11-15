import { EmailAttributes, GetThreadResponse } from '@mailsense/types';
import { UseQueryOptions } from '@tanstack/react-query';

export type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<EmailAttributes, Error>, 'queryKey' | 'queryFn'>;

export type UseGetThreadQueryOptions = Omit<UseQueryOptions<GetThreadResponse, Error>, 'queryKey' | 'queryFn'>;
