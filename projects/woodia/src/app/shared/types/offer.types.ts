export type TOfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface ISubmitOfferPayload {
    price: number;
    deliveryDay: number;
    description: string;
}

export interface IOffer {
    id: number;
    jobId: number;
    jobTitle?: string;
    price: number;
    deliveryDay: number;
    description: string;
    status: TOfferStatus;
    createdAt: string;
    jobSummary?: {
        id: number;
        title: string;
        description: string;
        deliveryDay: number;
        expectedBudget: number | null;
        jobStatus: string;
        modelConfig: any;
    };
}

export interface IMyOffersResponse {
    items: IOffer[];
    totalCount: number;
}

export type TCustomerOfferStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface ICustomerOffer {
    id: number;
    carpenterId: string;
    carpenterName: string;
    price: number;
    description: string;
    deliveryDay: number;
    status: TCustomerOfferStatus;
    createdAt: string;
}

export interface ICustomerOffersResponse {
    items: ICustomerOffer[];
    pageNumber: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}