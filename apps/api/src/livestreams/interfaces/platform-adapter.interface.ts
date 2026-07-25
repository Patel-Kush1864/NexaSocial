export interface PlatformAdapter {
  createBroadcast(
    accessToken: string,
    title: string,
    description?: string,
  ): Promise<{
    platformStreamId: string;
    streamUrl: string;
    streamKey: string;
  }>;

  startBroadcast(accessToken: string, platformStreamId: string): Promise<void>;

  stopBroadcast(accessToken: string, platformStreamId: string): Promise<void>;

  getStatus(accessToken: string, platformStreamId: string): Promise<string>;

  deleteBroadcast(accessToken: string, platformStreamId: string): Promise<void>;
}
