export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  order: number;
  qrCodeValue: string;
  lat: string | null;
  lng: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StampRecord {
  id: string;
  userId: string;
  checkpointId: string;
  acquiredAt: string;
}

export interface User {
  id: string;
  createdAt: string;
}

export interface AcquireStampRequest {
  userId: string;
  qrCodeValue: string;
}

export interface AcquireStampResponse {
  stamp: StampRecord;
  checkpoint: Checkpoint;
}

export interface ApiError {
  error: string;
  message?: string;
}
