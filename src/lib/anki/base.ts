export type AnkiNote = {
  deckName: string;
  modelName: string;
  fields: {
    [key: string]: string,
  };
};

export interface AnkiAPI {
  storeMediaFile(filename: string, url: string): Promise<{ result: string, error: string | null }>;
  addNote(note: AnkiNote): Promise<{ result: number, error: string | null }>;
  updateNoteFields(id: number, fields: { [key: string]: string }): Promise<{ result: null, error: string | null }>;
  notesInfo(query: string): Promise<{ [key: string]: string }[]>,
}
