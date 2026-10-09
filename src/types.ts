
export interface Song {
  id: string;
  name: string;
  composer: string;
  charters: {
    EZ?: string;
    HD?: string;
    IN?: string;
    AT?: string;
  };
  difficulties?: {
    EZ?: string;
    HD?: string;
    IN?: string;
    AT?: string;
  };
}

export interface FileInfo {
    type: string;
    name: string;
    url: string;
    tooltip?: string;
    // Size in bytes, when the server reports it.
    size?: number;
}
export type SortType = 'alphanumerical' | 'unsorted';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    type: SortType;
    direction: SortDirection;
}
