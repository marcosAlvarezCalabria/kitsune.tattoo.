export interface SocialMetric {
  readonly label: string;
  readonly value: string;
}

export interface ProfileImage {
  readonly alt: string;
  readonly remoteUrl: string;
  readonly localPath: string;
}

export interface Highlight {
  readonly name: string;
  readonly url: string;
}

export interface PortfolioPost {
  readonly caption: string;
  readonly remoteUrl: string;
  readonly localPath: string;
}

export interface HeroVideo {
  readonly localPath: string;
  readonly posterPath: string;
}

export interface HeroFrameSequence {
  readonly framePaths: readonly string[];
  readonly width: number;
  readonly height: number;
}

export interface CreatorProfile {
  readonly handle: string;
  readonly displayName: string;
  readonly category: string;
  readonly location: string;
  readonly bioLines: readonly string[];
  readonly metrics: readonly SocialMetric[];
  readonly highlights: readonly Highlight[];
  readonly styles: readonly string[];
  readonly profileImage: ProfileImage;
  readonly heroVideo: HeroVideo;
  readonly heroFrameSequence: HeroFrameSequence;
  readonly portfolioPosts: readonly PortfolioPost[];
  readonly profileUrl: string;
  readonly generatedAt: string;
}
