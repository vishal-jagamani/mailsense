
export interface UserDetailsObject {
    id: string;
    name: string;
    email: string;
    user_metadata: {
        [key: string]: string;
    };
}
