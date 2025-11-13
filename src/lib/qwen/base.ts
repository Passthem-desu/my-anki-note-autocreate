export interface QwenAPI {
  generateAudio(text: string): Promise<{ url: string }>;
  refineNote(data: { word: string, context: string }): Promise<{ word: string, context: string, desc: string }>;
}
