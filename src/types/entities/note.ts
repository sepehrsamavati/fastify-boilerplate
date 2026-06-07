export type INote = {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
};

export type INoteViewModel = {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
};
