import { env } from "$env/dynamic/private";
import type { AnkiAPI, AnkiNote } from "./base";

const ANKI_CONNECT_URL = env.ANKI_CONNECT_URL

const callAnki = async (data: any) => {
  return await fetch(ANKI_CONNECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export class ServerAnkiAPI implements AnkiAPI {
  async storeMediaFile(filename: string, url: string) {
    return await (await callAnki({
      action: 'storeMediaFile',
      version: 6,
      params: {
        filename: filename,
        url: url,
      },
    })).json()
  }

  async addNote(note: AnkiNote): Promise<{ result: number; error: string | null; }> {
    return await (await callAnki({
      "action": "addNote",
      "version": 6,
      "params": {
        "note": note
      }
    })).json()
  }

  async updateNoteFields(id: number, fields: { [key: string]: string; }): Promise<{ result: null; error: string | null; }> {
    return await (await callAnki({
      "action": "updateNote",
      "version": 6,
      "params": {
        "note": {
          fields: fields,
          id: id,
        }
      }
    })).json()
  }

  async notesInfo(query: string): Promise<{ [key: string]: string; }[]> {
    const data = await (await callAnki({
      "action": "notesInfo",
      "version": 6,
      "params": { query },
    })).json();
    return (data.result as any[]).map(note => {
      let obj = Object.fromEntries(Object.entries(note.fields as {
        [key: string]: { value: string }
      }).map(([key, obj]) => {
        return [key, obj.value]
      }))

      obj.noteId = note.noteId;

      return obj;
    })
  }
}
