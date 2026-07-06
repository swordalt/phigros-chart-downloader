
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
}