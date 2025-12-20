import { Email } from "./email.types";

export interface InboxSearchResultResponse {
    data: Email[]
    size: number
    page: number
    total: number
}