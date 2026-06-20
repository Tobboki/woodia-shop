export type MessageType = 'Text' | 'Image' | 'Video' | 'File' | 'System' | 'Audio';

export enum FileType {
    Text = 1,
    Image = 2,
    Video = 3,
    File = 4,
    System = 5,
    Audio = 6,
}

export interface MessageAttachmentResponse {
    id: number;
    fileUrl: string;
    fileType: FileType;
}

export interface MessageResponse {
    id: number;
    roomId: number;
    senderId: string | null;
    content: string;
    sentAt: string;
    isRead: boolean;
    messageType: MessageType;
    attachments: MessageAttachmentResponse[];
}

export interface ChatRoomResponse {
    id: number;
}

export interface ChatRoomListResponse {
    roomId: number;
    userId: string;
    name: string;
    jobTitle: string;
    lastMessageContent: string;
    lastMessageDate: string;
    unreadMessageCount: number;
}

export interface AttachmentRequest {
    fileUrl: string;
    fileType: FileType;
}

export interface SendMessageRequest {
    roomId: number;
    content: string | null;
    attachments: AttachmentRequest[];
}

export interface PaginatedList<T> {
    items: T[];
    pageNumber: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}