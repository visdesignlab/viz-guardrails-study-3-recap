import { AudioTag, StoredAnswer } from '../../store/types';
import { ParticipantData } from '../types';

export abstract class StorageEngine {
  protected engine: string;

  protected connected = false;

  protected currentParticipantId: string | null = null;

  constructor(engine: string) {
    this.engine = engine;
  }

  isConnected() {
    return this.connected;
  }

  getEngine() {
    return this.engine;
  }

  abstract connect(): Promise<void>;

  abstract initializeStudyDb(studyId: string, config: object): Promise<void>;

  abstract initializeParticipantSession(searchParams: Record<string, string>, urlParticipantId?: string): Promise<ParticipantData>;

  abstract getCurrentParticipantId(urlParticipantId?: string): Promise<string>;

  abstract clearCurrentParticipantId(): Promise<void>;

  abstract saveAnswer(currentStep: string, answer: StoredAnswer): Promise<void>;

  abstract saveAudioTags(tags: AudioTag[]): Promise<void>;

  abstract getAudioTags(): Promise<AudioTag[]>;

  abstract setSequenceArray(latinSquare: string[][]): Promise<void>;

  abstract getSequenceArray(): Promise<string[][] | null>;

  abstract getSequence(): Promise<string[]>;

  abstract getAllParticipantsData(): Promise<ParticipantData[]>;

  abstract getParticipantData(participantId?: string): Promise<ParticipantData | null>;

  abstract getAudio(participantId?: string): Promise<string>;

  abstract getTranscription(participantId?: string): Promise<string>;

  abstract nextParticipant(): Promise<ParticipantData>;

  abstract saveAudio(audioStream: MediaRecorder): Promise<void>;

  abstract verifyCompletion(answers: Record<string, StoredAnswer>): Promise<boolean>;
}
